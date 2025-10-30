import type { Keypoint } from '@tensorflow-models/pose-detection';

export function getAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abMag = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const cbMag = Math.sqrt(cb.x ** 2 + cb.y ** 2);

  // Handle zero magnitude to avoid division by zero
  if (abMag === 0 || cbMag === 0) {
    return 0; // Return 0° if points coincide
  }

  // Clamp cosine value to [-1, 1] to avoid floating-point errors
  const cosTheta = Math.max(-1, Math.min(1, dot / (abMag * cbMag)));
  const angleRad = Math.acos(cosTheta);
  return (angleRad * 180) / Math.PI;
}