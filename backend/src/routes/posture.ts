// Import required modules for routing and CSV handling
import { Router, Request, Response, NextFunction } from 'express';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { PostureFeedback, SessionLog } from '../types/types';

// Extend Request interface to include userId for session tracking
interface AuthRequest extends Request {
  userId?: string;
}

// Initialize Express router
const router = Router();
// In-memory storage for logs (replace with database in production)
const logs: SessionLog[] = [];

// Middleware to handle session IDs via cookies or headers
const checkSession = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get session ID from cookie or header
  let userId = req.cookies?.['session-id'] || req.headers['x-session-id'];
  if (!userId) {
    // Generate new session ID if none exists
    userId = uuidv4();
    res.cookie('session-id', userId, {
      httpOnly: true, // Prevent client-side access to cookie
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    });
  }
  req.userId = userId as string;
  // Set headers for API responses
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// Route to log posture feedback
router.post('/log', checkSession, (req: AuthRequest, res: Response) => {
  try {
    const { type, badPosture, reason } = req.body as PostureFeedback;
    // Validate request body
    if (!type || !['desk', 'squat'].includes(type) || typeof badPosture !== 'boolean' || !reason) {
      return res.status(400).json({ error: 'Invalid request: Missing or invalid fields (type must be "desk" or "squat")' });
    }
    // Create new log entry
    const log: SessionLog = {
      userId: req.userId!,
      timestamp: new Date().toISOString(),
      type,
      badPosture,
      reason,
    };
    logs.push(log);
    // Check if this is a new session
    const isNewSession = !req.headers['x-session-id'];
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.json(isNewSession ? { sessionId: req.userId } : { success: true });
  } catch (error: unknown) {
    console.error('Error in POST /api/posture/log:', error);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Route to export logs as CSV
router.get('/export', checkSession, (req: AuthRequest, res: Response) => {
  try {
    // Filter logs for the current user
    const userLogs = logs.filter(log => log.userId === req.userId);
    // Format logs for CSV
    const csvLogs = userLogs.map(log => ({
      userId: log.userId,
      timestamp: log.timestamp,
      type: log.type,
      badPosture: log.badPosture,
      backBent: log.reason.backBent || false,
      neckBent: log.reason.neckBent || false,
      backTooBent: log.reason.backTooBent || false,
      kneeOverToe: log.reason.kneeOverToe || false,
    }));
    // Convert to CSV using PapaParse
    const csv = Papa.unparse(csvLogs);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=sitpretty_session_logs.csv');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(csv);
  } catch (error: unknown) {
    console.error('Error in GET /api/posture/export:', error);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Route to fetch session history with optional filters
router.get('/history', checkSession, (req: AuthRequest, res: Response) => {
  try {
    let userLogs = logs.filter(log => log.userId === req.userId);
    // Apply type filter if provided
    if (req.query.type && ['desk', 'squat'].includes(req.query.type as string)) {
      userLogs = userLogs.filter(log => log.type === req.query.type);
    }
    // Apply date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate as string);
      const end = new Date(req.query.endDate as string);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        userLogs = userLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= start && logDate <= end;
        });
      }
    }
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.json(userLogs);
  } catch (error: unknown) {
    console.error('Error in GET /api/posture/history:', error);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Route to clear session logs
router.delete('/session', checkSession, (req: AuthRequest, res: Response) => {
  try {
    const initialLength = logs.length;
    // Remove logs for the current user
    const remainingLogs = logs.filter(log => log.userId !== req.userId);
    logs.length = 0;
    logs.push(...remainingLogs);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.json({ success: true, deleted: initialLength - logs.length });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/posture/session:', error);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Export the router for use in index.ts
export default router;