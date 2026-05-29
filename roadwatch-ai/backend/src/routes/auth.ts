import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { db } from '../database/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ROADWATCH_JWT_SECRET_KEY';

// Citizen Registration
router.post('/citizen/register', async (req: Request, res: Response) => {
  try {
    const { fullName, aadharNo, mobile, email, dob, address, password } = req.body;

    if (!fullName || !aadharNo || !mobile || !email || !dob || !address || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Hash passwords
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check unique Aadhar
    const existingAadhar = await db.citizen.findUnique({ where: { aadharNo } });
    if (existingAadhar) {
      return res.status(400).json({ error: 'A citizen with this Aadhar number is already registered.' });
    }

    // Check unique Email
    const existingEmail = await db.citizen.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'A citizen with this email address is already registered.' });
    }

    // Create Citizen
    const citizen = await db.citizen.create({
      data: {
        fullName,
        aadharNo,
        mobile,
        email,
        dob: new Date(dob),
        address,
        password: hashedPassword
      }
    });

    const token = jwt.sign(
      { id: citizen.id, email: citizen.email, role: 'citizen' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Citizen registered successfully.',
      token,
      user: { id: citizen.id, fullName: citizen.fullName, email: citizen.email, role: 'citizen' }
    });
  } catch (error: any) {
    console.error("Citizen registration error:", error);
    return res.status(500).json({ error: error.message || 'Server error occurred during registration.' });
  }
});

// Citizen Login
router.post('/citizen/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const citizen = await db.citizen.findUnique({ where: { email } });
    if (!citizen) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, citizen.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: citizen.id, email: citizen.email, role: 'citizen' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: { id: citizen.id, fullName: citizen.fullName, email: citizen.email, role: 'citizen' }
    });
  } catch (error: any) {
    console.error("Citizen login error:", error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Government Registration
router.post('/government/register', async (req: Request, res: Response) => {
  try {
    const { employeeId, department, officialEmail, designation, password } = req.body;

    if (!employeeId || !department || !officialEmail || !designation || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check unique employeeId
    const existingEmp = await db.governmentUser.findUnique({ where: { employeeId } });
    if (existingEmp) {
      return res.status(400).json({ error: 'A user with this Employee ID is already registered.' });
    }

    // Check unique email
    const existingEmail = await db.governmentUser.findUnique({ where: { officialEmail } });
    if (existingEmail) {
      return res.status(400).json({ error: 'A user with this official email is already registered.' });
    }

    const govUser = await db.governmentUser.create({
      data: {
        employeeId,
        name: employeeId,
        department,
        officialEmail,
        designation,
        password: hashedPassword,
        approvalStatus: 'PENDING' // Defaults to pending approval
      }
    });

    const token = jwt.sign(
      { id: govUser.id, email: govUser.officialEmail, role: 'government', approvalStatus: 'PENDING' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Government official registered. Awaiting admin approval.',
      token,
      user: {
        id: govUser.id,
        name: govUser.name,
        employeeId: govUser.employeeId,
        officialEmail: govUser.officialEmail,
        department: govUser.department,
        designation: govUser.designation,
        role: 'government',
        approvalStatus: 'PENDING'
      }
    });
  } catch (error: any) {
    console.error("Gov registration error:", error);
    return res.status(500).json({ error: error.message || 'Server error occurred.' });
  }
});

// Government Login
router.post('/government/login', async (req: Request, res: Response) => {
  try {
    const { officialEmail, password } = req.body;

    if (!officialEmail || !password) {
      return res.status(400).json({ error: 'Official email and password are required.' });
    }

    const govUser = await db.governmentUser.findUnique({ where: { officialEmail } });
    if (!govUser) {
      return res.status(401).json({ error: 'Invalid official email or password.' });
    }

    // Support plain-text passwords for fallback DB or bcrypt hashes for production
    let match: boolean;
    if (govUser.password.startsWith('$2b$')) {
      // Assume bcrypt hash
      match = await bcrypt.compare(password, govUser.password);
    } else {
      // Plain text comparison
      match = password === govUser.password;
    }
    if (!match) {
      return res.status(401).json({ error: 'Invalid official email or password.' });
    }

    const token = jwt.sign(
      { 
        id: govUser.id, 
        email: govUser.officialEmail, 
        role: 'government', 
        govRole: govUser.govRole,
        approvalStatus: govUser.approvalStatus 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: govUser.id,
        name: govUser.name,
        employeeId: govUser.employeeId,
        officialEmail: govUser.officialEmail,
        department: govUser.department,
        designation: govUser.designation,
        role: 'government',
        govRole: govUser.govRole,
        approvalStatus: govUser.approvalStatus
      }
    });
  } catch (error: any) {
    console.error("Gov login error:", error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Pending Officials List (accessible for dashboard demo)
router.get('/government/pending', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const pendingList = await db.governmentUser.findMany({
      where: { approvalStatus: 'PENDING' }
    });
    return res.json(pendingList);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch pending government officials.' });
  }
});

// Approve Government Official
router.put('/government/:id/approve', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (APPROVED/REJECTED) is required.' });
    }

    const updatedUser = await db.governmentUser.update({
      where: { id },
      data: { approvalStatus: status }
    });

    return res.json({
      message: `User status updated to ${status} successfully.`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Approve official error:", error);
    return res.status(500).json({ error: 'Failed to update official status.' });
  }
});

// Auto-approve all pending (Helper for demo purposes)
router.post('/government/approve-all-debug', async (req: Request, res: Response) => {
  try {
    const pendingList = await db.governmentUser.findMany({
      where: { approvalStatus: 'PENDING' }
    });
    for (const user of pendingList) {
      await db.governmentUser.update({
        where: { id: user.id },
        data: { approvalStatus: 'APPROVED' }
      });
    }
    return res.json({ message: `Approved all ${pendingList.length} pending officials for testing.` });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to auto-approve officials.' });
  }
});

export default router;
