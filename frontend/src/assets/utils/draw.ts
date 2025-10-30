// Import Keypoint type from TensorFlow.js
import type { Keypoint } from '@tensorflow-models/pose-detection';

// Function to draw keypoints on canvas
export const drawKeypoints = (keypoints: Keypoint[], ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = 'var(--keypoint-color)'; // Color for keypoints
  ctx.strokeStyle = 'var(--keypoint-color)';
  ctx.lineWidth = 2;

  // Draw a circle for each keypoint with sufficient confidence
  for (const keypoint of keypoints) {
    if (keypoint.score && keypoint.score > 0.5) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
};

// Function to draw skeleton lines between keypoints
export const drawSkeleton = (keypoints: Keypoint[], ctx: CanvasRenderingContext2D) => {
  // Define connections between keypoints (e.g., nose to shoulder)
  const connections = [
    [0, 1], [1, 3], [3, 5], [5, 7], [7, 9], // Head to left arm
    [0, 2], [2, 4], [4, 6], [6, 8], [8, 10], // Head to right arm
    [5, 6], [5, 11], [6, 12], [11, 12], // Torso
    [11, 13], [13, 15], // Left leg
    [12, 14], [14, 16], // Right leg
  ];

  ctx.strokeStyle = 'var(--skeleton-color)'; // Color for skeleton lines
  ctx.lineWidth = 2;

  // Draw lines between connected keypoints
  for (const [startIdx, endIdx] of connections) {
    const start = keypoints[startIdx];
    const end = keypoints[endIdx];
    if (start.score && end.score && start.score > 0.5 && end.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }
};
