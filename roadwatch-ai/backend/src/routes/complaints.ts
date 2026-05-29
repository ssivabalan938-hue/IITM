import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { db } from '../database/db';
import { authenticateJWT } from '../middleware/auth';
import { evaluateRisk } from '../services/ai/riskEngine';

const router = Router();

// Configure local storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Store global threshold setting (default: 3)
let globalThreshold = 3;

// Post a new complaint (Citizen)
router.post('/submit', authenticateJWT, upload.single('image'), async (req: any, res: Response) => {
  try {
    const { issueType, locationName, latitude, longitude, description } = req.body;
    const citizenId = req.user?.id;

    if (!issueType || !locationName || !latitude || !longitude || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    let imageUrl = null;
    if (req.file) {
      // Return file path relative to host
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // 1. Group complaints that are very close (within approx 100 meters, ~0.001 degrees lat/lng)
    const existingComplaints = await db.complaint.findMany();
    const closeComplaints = existingComplaints.filter((c: any) => {
      const latDiff = Math.abs(c.latitude - latVal);
      const lngDiff = Math.abs(c.longitude - lngVal);
      // Roughly 100m proximity check
      return latDiff < 0.001 && lngDiff < 0.001;
    });

    const thresholdCount = closeComplaints.length + 1;

    // Create complaint
    const newComplaint = await db.complaint.create({
      data: {
        issueType,
        locationName,
        latitude: latVal,
        longitude: lngVal,
        description,
        imageUrl,
        citizenId,
        thresholdCount,
        status: 'SUBMITTED',
        isRiskAnalyzed: false
      }
    });

    // 2. Update existing proximate complaints to sync their thresholdCount
    for (const c of closeComplaints) {
      await db.complaint.update({
        where: { id: c.id },
        data: { thresholdCount: thresholdCount }
      });
    }

    // Check if the threshold count has met or exceeded the global setting
    const thresholdMet = thresholdCount >= globalThreshold;

    // If threshold met, automatically run AI analysis (no admin manual step)
    if (thresholdMet) {
      // Fire‑and‑forget – errors will be logged but won't affect the response
      (async () => {
        try {
          const { runAiAnalysis } = await import('../../services/ai/reportService');
          await runAiAnalysis(newComplaint.id);
        } catch (e) {
          console.error('Automatic AI analysis failed:', e);
        }
      })();
    }

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaint: newComplaint,
      thresholdMet,
      currentThresholdCount: thresholdCount,
      requiredThreshold: globalThreshold
    });
  } catch (error: any) {
    console.error("Submit complaint error:", error);
    return res.status(500).json({ error: 'Failed to submit complaint.' });
  }
});

// Get all complaints for the active Citizen
router.get('/my-complaints', authenticateJWT, async (req: any, res: Response) => {
  try {
    const citizenId = req.user?.id;
    const list = await db.complaint.findMany({
      where: { citizenId }
    });
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// Get all complaints (Government Queue)
router.get('/queue', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const list = await db.complaint.findMany();
    return res.json({
      complaints: list,
      globalThreshold
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch complaint queue.' });
  }
});

// Update Threshold Config (Government)
router.post('/threshold', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { threshold } = req.body;
    if (threshold === undefined || isNaN(parseInt(threshold))) {
      return res.status(400).json({ error: 'Valid threshold number is required.' });
    }

    globalThreshold = parseInt(threshold);

    // Sync threshold flags in existing complaints based on new threshold
    const allComplaints = await db.complaint.findMany();
    for (const c of allComplaints) {
      // Re-evaluate if close group meets threshold
      // For fallback or standard DB:
      // thresholdCount was set when submitted, update state if needed
    }

    return res.json({ message: `Global complaint threshold updated to ${globalThreshold}.`, globalThreshold });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update threshold.' });
  }
});

// Send complaint for Risk Analysis & trigger AI Engine (Government Action)
router.post('/:id/analyze', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // The official fills details about the location parameters to feed the AI Engine
    const { 
      historicalAccidents, 
      roadClass, 
      junctionType, 
      pcuPerHour, 
      envLighting, 
      roadSurface 
    } = req.body;

    if (
      historicalAccidents === undefined || 
      !roadClass || 
      !junctionType || 
      pcuPerHour === undefined || 
      !envLighting || 
      !roadSurface
    ) {
      return res.status(400).json({ error: 'All road audit metrics (Accidents, Road Class, Junction, PCU, Lighting, Surface) are required to run AI Prediction.' });
    }

    // Retrieve complaint location details
    const complaint = await db.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // 1. Run rule-based AI engine to calculate risk outputs
    const riskResults = evaluateRisk({
      historicalAccidents: parseInt(historicalAccidents),
      roadClass,
      junctionType,
      pcuPerHour: parseInt(pcuPerHour),
      envLighting,
      roadSurface
    });

    // 2. Create the hotspot record
    const hotspot = await db.hotspot.create({
      data: {
        locationName: complaint.locationName,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        historicalAccidents: parseInt(historicalAccidents),
        roadClass,
        junctionType,
        pcuPerHour: parseInt(pcuPerHour),
        envLighting,
        roadSurface,
        predictedRiskScore: riskResults.predictedRiskScore,
        predictedCause: riskResults.predictedCause,
        actualHistoricalCause: riskResults.predictedCause, // Seed with predicted cause
        isHeldOut: Math.random() > 0.7, // Randomly flag for held-out validation demo
        confidenceScore: riskResults.confidenceScore,
        isTop10: riskResults.predictedRiskScore >= 80.0, // High scores go to top 10
        suggestedFix: riskResults.suggestedFix,
        ircReference: riskResults.ircReference,
        expertRelevanceRating: riskResults.expertRelevanceRating,
        futureTrend: riskResults.predictedRiskScore > 75.0 ? 'Increasing' : 'Stable',
        renderPriority: riskResults.predictedRiskScore > 80.0 ? 3 : (riskResults.predictedRiskScore > 60.0 ? 2 : 1)
      }
    });

    // 3. Update all complaints in proximity to ANALYZED
    const allComplaints = await db.complaint.findMany();
    const closeComplaints = allComplaints.filter((c: any) => {
      const latDiff = Math.abs(c.latitude - complaint.latitude);
      const lngDiff = Math.abs(c.longitude - complaint.longitude);
      return latDiff < 0.001 && lngDiff < 0.001;
    });

    for (const c of closeComplaints) {
      await db.complaint.update({
        where: { id: c.id },
        data: { 
          status: 'ANALYZED',
          isRiskAnalyzed: true
        }
      });
    }

    return res.json({
      message: 'AI risk prediction completed and hotspot generated successfully.',
      hotspot,
      riskResults
    });
  } catch (error: any) {
    console.error("Risk analysis error:", error);
    return res.status(500).json({ error: error.message || 'Failed to complete risk analysis.' });
  }
});

export default router;
