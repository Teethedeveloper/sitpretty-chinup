// src/types/types.ts
export interface SessionLog {
  userId: string;
  timestamp: string;
  type: 'desk' | 'squat';
  badPosture: boolean;
  reason: {
    backBent?: boolean;
    neckBent?: boolean;
    backTooBent?: boolean;
    kneeOverToe?: boolean;
    insufficientKeypointConfidence?: boolean;
    [key: string]: boolean | undefined; // Index signature
  };
}

export interface PostureFeedback {
  type: 'desk' | 'squat';
  badPosture: boolean;
  reason: {
    backBent?: boolean;
    neckBent?: boolean;
    backTooBent?: boolean;
    kneeOverToe?: boolean;
    insufficientKeypointConfidence?: boolean;
    [key: string]: boolean | undefined; // Index signature
  };
}