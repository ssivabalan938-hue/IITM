import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ROADWATCH_JWT_SECRET_KEY';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'citizen' | 'government';
    email: string;
    approvalStatus?: string;
    govRole?: 'ADMIN' | 'ENGINEER';
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Token is invalid or expired.' });
      }

      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing.' });
  }
}

export function requireGovernment(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'government') {
    return res.status(403).json({ error: 'Access restricted to government officials.' });
  }
  
  if (req.user.approvalStatus === 'PENDING') {
    return res.status(403).json({ error: 'Your government official registration is pending admin approval.' });
  }

  next();
}
