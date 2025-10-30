// Define interface for session log data
export interface SessionLog {
  userId: string; // Unique identifier for the user session
  timestamp: string; // ISO timestamp of the log entry
  type: 'desk' | 'squat'; // Posture mode (desk or squat)
  badPosture: boolean; // Whether posture was bad
  reason: { [key: string]: boolean }; // Reasons for bad posture (e.g., backBent, neckBent)
}

// Define interface for posture feedback sent to the server
export interface PostureFeedback {
  userId: string; // Unique identifier for the user session
  timestamp: string; // ISO timestamp of the log entry
  type: 'desk' | 'squat'; // Posture mode (desk or squat)
  badPosture: boolean; // Whether posture is bad
  reason: { [key: string]: boolean }; // Specific reasons for bad posture
}