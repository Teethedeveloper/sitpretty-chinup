// Import required modules for the Express server
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import postureRoutes from './routes/posture';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
// Set default port from environment or fallback to 3000
const PORT = process.env.PORT || 3000;

// Disable 'x-powered-by' header for security
app.disable('x-powered-by');

// Middleware to set response headers for security and caching
app.use((req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Set headers for API routes
  if (req.path.startsWith('/api')) {
    // Prevent caching for API responses
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    // Set Content-Security-Policy to restrict script sources
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; object-src 'none';"
    );
    // Log headers for debugging
    console.log(`Headers set for ${req.path}:`, {
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
    });
  } else {
    // Cache static assets for one year
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

// Enable cookie parsing for session management
app.use(cookieParser());
// Enable CORS for frontend communication
app.use(
  cors({
    origin: 'http://localhost:5173', // Allow requests from Vite dev server
    credentials: true, // Allow cookies to be sent
  })
);
// Parse JSON request bodies
app.use(express.json());

// Root route for API welcome message
app.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ message: 'Welcome to the SitPretty ChinUp API' });
});

// Mount posture-related routes
app.use('/api/posture', postureRoutes);

// Error handling middleware for unexpected errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});