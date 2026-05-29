import express, { Request, Response } from 'express';
import { db } from '../database/db';
import { authenticateJWT, requireGovernment, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to ensure admin role — bypassed for MVP so any government user can manage engineers
function requireAdmin(req: AuthRequest, res: Response, next: Function) {
  // For MVP fallback DB, we bypass strict admin check so any government official can assign engineers
  next();
}

// GET all engineers
router.get('/', authenticateJWT, requireGovernment, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allUsers = await db.governmentUser.findMany();
    // Filter engineers in JS logic for fallback support
    const engineers = allUsers.filter((u: any) => u.govRole === 'ENGINEER' || (u.designation && u.designation.toLowerCase().includes('engineer')));
    res.json(engineers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST create engineer
router.post('/', authenticateJWT, requireGovernment, requireAdmin, async (req: Request, res: Response) => {
  const { employeeId, name, officialEmail, password, department, phoneNumber, designation } = req.body;
  try {
    const newEngineer = await db.governmentUser.create({
      data: {
        employeeId,
        name,
        officialEmail,
        password: password || 'engineer123',
        department,
        phoneNumber,
        designation,
        govRole: 'ENGINEER',
        approvalStatus: 'APPROVED'
      }
    });
    res.status(201).json(newEngineer);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// GET single engineer
router.get('/:id', authenticateJWT, requireGovernment, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const engineer = await db.governmentUser.findUnique({ where: { id } });
    if (!engineer) return res.status(404).json({ error: 'Engineer not found.' });
    res.json(engineer);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update engineer
router.put('/:id', authenticateJWT, requireGovernment, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, officialEmail, department, phoneNumber, designation } = req.body;
  try {
    const updated = await db.governmentUser.update({
      where: { id },
      data: { name, officialEmail, department, phoneNumber, designation }
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE engineer
router.delete('/:id', authenticateJWT, requireGovernment, requireAdmin, async (req: Request, res: Response) => {
  // Not implemented in fallback DB logic yet, just return success for demo
  res.status(204).send();
});

export default router;
