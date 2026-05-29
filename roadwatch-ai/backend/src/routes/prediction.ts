import { Router, Request, Response } from 'express';
import { db } from '../database/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Get all hotspots (AI Risk Predictions)
router.get('/hotspots', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const hotspots = await db.hotspot.findMany();
    return res.json(hotspots);
  } catch (error: any) {
    console.error("Fetch hotspots error:", error);
    return res.status(500).json({ error: 'Failed to fetch predicted hotspots.' });
  }
});

// Get a single hotspot detailed view
router.get('/hotspots/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hotspot = await db.hotspot.findUnique({ where: { id } });
    if (!hotspot) {
      return res.status(404).json({ error: 'Hotspot not found.' });
    }
    return res.json(hotspot);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch hotspot details.' });
  }
});

// Trigger a manual run of rule-based engine on a custom coordinate (simulate testing new road segments)
router.post('/evaluate-custom', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { 
      locationName, 
      latitude, 
      longitude, 
      historicalAccidents, 
      roadClass, 
      junctionType, 
      pcuPerHour, 
      envLighting, 
      roadSurface 
    } = req.body;

    if (
      !locationName || 
      latitude === undefined || 
      longitude === undefined || 
      historicalAccidents === undefined || 
      !roadClass || 
      !junctionType || 
      pcuPerHour === undefined || 
      !envLighting || 
      !roadSurface
    ) {
      return res.status(400).json({ error: 'All fields are required to predict custom road segment risk.' });
    }

    const { evaluateRisk } = require('../services/ai/riskEngine');
    const riskResults = evaluateRisk({
      historicalAccidents: parseInt(historicalAccidents),
      roadClass,
      junctionType,
      pcuPerHour: parseInt(pcuPerHour),
      envLighting,
      roadSurface
    });

    const newHotspot = await db.hotspot.create({
      data: {
        locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        historicalAccidents: parseInt(historicalAccidents),
        roadClass,
        junctionType,
        pcuPerHour: parseInt(pcuPerHour),
        envLighting,
        roadSurface,
        predictedRiskScore: riskResults.predictedRiskScore,
        predictedCause: riskResults.predictedCause,
        actualHistoricalCause: riskResults.predictedCause,
        isHeldOut: false,
        confidenceScore: riskResults.confidenceScore,
        isTop10: riskResults.predictedRiskScore >= 80.0,
        suggestedFix: riskResults.suggestedFix,
        ircReference: riskResults.ircReference,
        expertRelevanceRating: riskResults.expertRelevanceRating,
        futureTrend: riskResults.predictedRiskScore > 75.0 ? 'Increasing' : 'Stable',
        renderPriority: riskResults.predictedRiskScore > 80.0 ? 3 : (riskResults.predictedRiskScore > 60.0 ? 2 : 1)
      }
    });

    return res.status(201).json({
      message: 'Custom road segment evaluated and added to hotspots.',
      hotspot: newHotspot
    });
  } catch (error: any) {
    console.error("Evaluate custom error:", error);
    return res.status(500).json({ error: error.message || 'Failed to evaluate road segment.' });
  }
});

export default router;
