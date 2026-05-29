import { Router, Request, Response } from 'express';
import { db } from '../database/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Get all road interventions and their construction status (Government Tab 3)
router.get('/status-list', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const list = await db.constructionStatus.findMany();
    return res.json(list);
  } catch (error: any) {
    console.error("Fetch construction status error:", error);
    return res.status(500).json({ error: 'Failed to fetch construction progress.' });
  }
});

// Update the construction stage of a specific hotspot intervention
router.put('/:hotspotId/update', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { hotspotId } = req.params;
    const { 
      status, notes, progress, 
      beforePhotoUrl, constructionPhotoUrl, completionPhotoUrl,
      engineeringNotes, governmentNotes, budgetDetails, 
      internalRecommendations, assignedTeam, assignedEngineerId, assignedEngineerName,
      severityScore, priorityRank, targetDate, startDate 
    } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'UNDER_CONSTRUCTION', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'A valid construction state is required.' });
    }

    const updatedStatus = await db.constructionStatus.update({
      where: { hotspotId },
      data: {
        status,
        notes: notes || 'Status updated via dashboard.',
        progress,
        beforePhotoUrl,
        constructionPhotoUrl,
        completionPhotoUrl,
        engineeringNotes,
        governmentNotes,
        budgetDetails,
        internalRecommendations,
        assignedTeam,
        assignedEngineerId,
        assignedEngineerName,
        severityScore,
        priorityRank,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined
      }
    });

    return res.json({
      message: `Intervention construction status updated to ${status} successfully.`,
      status: updatedStatus
    });
  } catch (error: any) {
    console.error("Update construction error:", error);
    return res.status(500).json({ error: 'Failed to update construction progress.' });
  }
});

export default router;
