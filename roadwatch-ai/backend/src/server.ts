import express from 'express';
import cors from 'cors';
import path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRouter from './routes/auth';
import complaintsRouter from './routes/complaints';
import predictionRouter from './routes/prediction';
import interventionRouter from './routes/intervention';
import engineersRouter from './routes/engineers';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // For local dev, allow any origin. In production, restrict to frontend domain.
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists and serve it statically
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Route handlers
app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/prediction', predictionRouter);
app.use('/api/intervention', interventionRouter);
app.use('/api/engineers', engineersRouter);

// Health check API
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    mode: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` ROADWATCH AI BACKEND RUNNING ON PORT ${PORT}`);
  console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
