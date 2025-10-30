// src/assets/utils/postureRules.ts
import type { Keypoint } from '@tensorflow-models/pose-detection';
import type { PostureFeedback } from '../../types/types';
import { getAngle } from './geometry';

export const checkDeskPosture = (keyPoints: Keypoint[]): PostureFeedback => {
  const nose = keyPoints[0];
  const leftShoulder = keyPoints[5];
  const rightShoulder = keyPoints[6];
  const leftHip = keyPoints[11];
  const rightHip = keyPoints[12];

  if (!nose.score || !leftShoulder.score || !rightShoulder.score || !leftHip.score || !rightHip.score) {
    return { type: 'desk', badPosture: false, reason: { insufficientKeypointConfidence: true } };
  }

  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const backAngle = getAngle(nose, shoulderMid, hipMid);
  const neckAngle = getAngle(nose, shoulderMid, { x: shoulderMid.x, y: shoulderMid.y - 100 });
  if (backAngle < -30 || backAngle > 30) {
    return { type: 'desk', badPosture: true, reason: { backBent: true } };
  }
  if (neckAngle < -20 || neckAngle > 20) {
    return { type: 'desk', badPosture: true, reason: { neckBent: true } };
  }

  return { type: 'desk', badPosture: false, reason: { backBent: false, neckBent: false } };
};

export const checkSquatPosture = (keyPoints: Keypoint[]): PostureFeedback => {
  const leftKnee = keyPoints[13];
  const rightKnee = keyPoints[14];
  const leftAnkle = keyPoints[15];
  const rightAnkle = keyPoints[16];
  const leftHip = keyPoints[11];
  const rightHip = keyPoints[12];

  if (
    !leftKnee.score ||
    !rightKnee.score ||
    !leftAnkle.score ||
    !rightAnkle.score ||
    !leftHip.score ||
    !rightHip.score
  ) {
    return { type: 'squat', badPosture: false, reason: { insufficientKeypointConfidence: true } };
  }

  const kneeOverToeLeft = leftKnee.x - leftAnkle.x;
  const kneeOverToeRight = rightKnee.x - rightAnkle.x;
  if (Math.abs(kneeOverToeLeft) > 50 || Math.abs(kneeOverToeRight) > 50) {
    return { type: 'squat', badPosture: true, reason: { kneeOverToe: true } };
  }

  const hipMid = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  const kneeMid = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 };
  const backAngle = getAngle(hipMid, kneeMid, { x: kneeMid.x, y: kneeMid.y - 100 });
  if (backAngle < -45 || backAngle > 45) {
    return { type: 'squat', badPosture: true, reason: { backTooBent: true } };
  }

  return { type: 'squat', badPosture: false, reason: { kneeOverToe: false, backTooBent: false } };
};
