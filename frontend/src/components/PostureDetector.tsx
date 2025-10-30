import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { useNavigate } from 'react-router-dom';
import useTimer from '../hooks/useTimer';
import { drawKeypoints, drawSkeleton } from '../assets/utils/draw';
import { checkDeskPosture, checkSquatPosture } from '../assets/utils/postureRules';
import type { PostureFeedback, SessionLog } from '../types/types';
import '../styles/global.scss';

interface PostureDetectorProps {
  autoRedirect?: boolean;
}

const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;

const PostureDetector: React.FC<PostureDetectorProps> = ({ autoRedirect = true }) => {
  const [mode, setMode] = useState<'desk' | 'squat' | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postureStatus, setPostureStatus] = useState<'good' | 'bad' | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const { time, seconds, isRunning, startTimer, pauseTimer, resumeTimer, resetTimer } = useTimer(
    300,
    () => {
      setWebcamEnabled(false);
      setSessionCompleted(true);
      if (autoRedirect) {
        navigate('/dashboard', { state: { logs: sessionLogs, duration: 300 } });
      }
    }
  );

  // Load MoveNet model
  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        const model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        });
        setDetector(model);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load MoveNet model: ${errorMessage}`);
        console.error('Model loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadModel();
  }, []);

  // Dispose detector on unmount or when it changes
  useEffect(() => {
    return () => {
      detector?.dispose();
    };
  }, [detector]);

  // Start session and get session ID
  const startSession = useCallback(async () => {
    if (!mode) {
      setError('Mode not selected.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/posture/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: mode, badPosture: false, reason: { backBent: false, neckBent: false } }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setSessionId(data.sessionId);
      setWebcamEnabled(true); // Start webcam only after session ID is ready
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start session: ${errorMessage}`);
      console.error('Start session error:', err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Posture detection loop
  useEffect(() => {
    const detectPosture = async () => {
      if (
        !detector ||
        !webcamEnabled ||
        !webcamRef.current?.video ||
        !canvasRef.current ||
        webcamRef.current.video.videoWidth === 0 ||
        webcamRef.current.video.videoHeight === 0
      )
        return;

      try {
        const poses = await detector.estimatePoses(webcamRef.current.video);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (ctx && poses.length > 0) {
          drawKeypoints(poses[0].keypoints, ctx);
          drawSkeleton(poses[0].keypoints, ctx);

          const feedback: PostureFeedback = mode === 'desk'
            ? checkDeskPosture(poses[0].keypoints)
            : checkSquatPosture(poses[0].keypoints);

          setPostureStatus(feedback.badPosture ? 'bad' : 'good');

          if (feedback.badPosture && sessionId) {
            const newLog: SessionLog = {
              userId: sessionId,
              timestamp: new Date().toISOString(),
              type: mode!,
              badPosture: true,
              reason: feedback.reason,
            };
            setSessionLogs(prev => [...prev, newLog]);

            // Send to server
            fetch('/api/posture/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
              credentials: 'include',
              body: JSON.stringify(newLog),
            }).then(res => {
              if (!res.ok) console.error(`API error: ${res.status} ${res.statusText}`);
            });
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Error detecting posture: ${errorMessage}`);
        console.error('Posture detection error:', err);
      }
    };

    let interval: ReturnType<typeof setInterval> | null = null;
    if (webcamEnabled && isRunning) {
      interval = setInterval(detectPosture, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [detector, webcamEnabled, mode, isRunning, sessionId]);

  return (
    <div
      className="posture-detector"
      style={{
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'auto',
        padding: '0.5rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <header>
        <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>SitPretty & ChinUp</h1>
      </header>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!mode && (
        <div className="button-group" style={{ marginBottom: '1rem' }}>
          <button onClick={() => setMode('desk')} disabled={loading} style={{ marginRight: '0.5rem' }}>Desk Mode</button>
          <button onClick={() => setMode('squat')} disabled={loading}>Squat Mode</button>
        </div>
      )}

      {mode && !webcamEnabled && (
        <div style={{ marginBottom: '1rem' }}>
          <p>Selected Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}</p>
          <div className="button-group">
            <button onClick={startSession} disabled={loading}>Start Webcam</button>
          </div>
        </div>
      )}

      {webcamEnabled && (
        <div style={{ width: VIDEO_WIDTH, maxWidth: '100vw' }}>
          <div className="relative" style={{ position: 'relative', width: VIDEO_WIDTH, height: VIDEO_HEIGHT, maxWidth: '100vw', maxHeight: '60vh', margin: '0 auto' }}>
            <Webcam
              ref={webcamRef}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              className="pose-canvas"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', zIndex: 1 }}
              onUserMedia={startTimer}
              onUserMediaError={() => { setError('Failed to access webcam. Please check permissions.'); setWebcamEnabled(false); pauseTimer(); }}
            />
            <canvas
              ref={canvasRef}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
            />
          </div>
          <div style={{ marginTop: '1rem', width: '100%' }}>
            <p>Time Remaining: {time}</p>
            <div className="progress-bar" style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <div
                className="progress-bar-inner"
                style={{
                  width: `${((300 - seconds) / 300) * 100}%`,
                  height: '100%',
                  background: '#4caf50',
                  borderRadius: '4px'
                }}
              />
            </div>
            <p className={`posture-status-${postureStatus}`}>
              Posture: {postureStatus === 'bad' ? 'Bad' : postureStatus === 'good' ? 'Good' : 'Detecting...'}
            </p>
            <div className="button-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={isRunning ? pauseTimer : resumeTimer}>{isRunning ? 'Pause' : 'Resume'}</button>
              <button onClick={() => { resetTimer(); setWebcamEnabled(false); setSessionCompleted(true); navigate('/dashboard', { state: { logs: sessionLogs, duration: 300 - seconds } }); }}>End Session</button>
            </div>
          </div>
        </div>
      )}

      {sessionCompleted && !autoRedirect && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <h2>Session Complete!</h2>
            <p>Your 5-minute posture session has ended.</p>
            <div className="button-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/dashboard', { state: { logs: sessionLogs, duration: 300 - seconds } })}>View Results</button>
              <button onClick={() => { setSessionCompleted(false); setMode(null); resetTimer(); }}>Start New Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostureDetector;
