import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

const MAX_RECORD_SECONDS = 60;

const VoiceRecorder = ({ onAudioChange, label = 'Attach Voice Message' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const startTimeRef = useRef(null);

  // Cleanup timers & streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMsg('');
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Microphone access is not supported in this browser. You can upload an audio file below.');
      setShowFileUpload(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect supported mimeType
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const supportedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) || '';

      const options = supportedMime ? { mimeType: supportedMime } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);

        let dur = 0;
        if (startTimeRef.current) {
          dur = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
        }

        // Decode audio data using Web Audio API for exact finite duration
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const arr = await blob.arrayBuffer();
            const decoded = await ctx.decodeAudioData(arr);
            if (decoded && isFinite(decoded.duration) && decoded.duration > 0) {
              dur = decoded.duration;
            }
            ctx.close();
          }
        } catch (e) {
          // Fallback to elapsed duration
        }

        setRecordedDuration(dur);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Notify parent
        if (onAudioChange) onAudioChange(blob);

        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordSeconds(0);
      setRecordedDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= MAX_RECORD_SECONDS - 1) {
            stopRecording();
            return MAX_RECORD_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMsg('Could not access microphone. Please check browser permissions or upload an audio file.');
      setShowFileUpload(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordSeconds(0);
    setRecordedDuration(0);
    setErrorMsg('');
    if (onAudioChange) onAudioChange(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);

    let dur = 0;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const arr = await file.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr);
        if (decoded && isFinite(decoded.duration) && decoded.duration > 0) {
          dur = decoded.duration;
        }
        ctx.close();
      }
    } catch (e) {}

    setRecordedDuration(dur);
    setAudioBlob(file);
    setAudioUrl(url);
    if (onAudioChange) onAudioChange(file);
  };

  const formatTimer = (s) => {
    if (!s || isNaN(s) || !isFinite(s) || s < 0) return '00:00';
    const totalSecs = Math.round(s);
    const min = Math.floor(totalSecs / 60);
    const sec = Math.floor(totalSecs % 60);
    return `0${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="voice-recorder-card">
      <div className="voice-recorder-header">
        <label className="voice-recorder-label">
          🎙️ {label}
          <span className="voice-recorder-subtext">
            (Explain details, exact location landmarks, or specific ownership clues verbally)
          </span>
        </label>
      </div>

      {errorMsg && (
        <div className="auth-alert-error" style={{ margin: '8px 0 12px', fontSize: '13px' }}>
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* State 1: Idle (Not recording and no audio recorded yet) */}
      {!isRecording && !audioUrl && (
        <div className="voice-recorder-controls">
          <button
            type="button"
            className="btn-record-start"
            onClick={startRecording}
          >
            <span className="mic-icon">🎙️</span>
            <span>Record Voice Note (Up to 60s)</span>
          </button>

          <button
            type="button"
            className="btn-subtle-pill"
            style={{ fontSize: '12px' }}
            onClick={() => setShowFileUpload(!showFileUpload)}
          >
            {showFileUpload ? '✕ Hide File Upload' : '📁 Upload Audio File Instead'}
          </button>
        </div>
      )}

      {/* State 2: Currently Recording */}
      {isRecording && (
        <div className="voice-recording-active">
          <div className="recording-indicator">
            <span className="recording-pulsing-dot" />
            <span className="recording-live-text">Recording Audio...</span>
            <span className="recording-timer">
              {formatTimer(recordSeconds)} / 01:00
            </span>
          </div>

          <button
            type="button"
            className="btn-record-stop"
            onClick={stopRecording}
          >
            ⏹️ Stop & Save ({formatTimer(recordSeconds)})
          </button>
        </div>
      )}

      {/* State 3: Recorded Audio Ready - Showing exact recorded timeline */}
      {audioUrl && !isRecording && (
        <div className="voice-recorded-preview">
          <div style={{ flex: 1 }}>
            <AudioPlayer 
              audioSrc={audioUrl} 
              title="Your Recorded Voice Message" 
              initialDuration={recordedDuration || recordSeconds}
            />
          </div>

          <div className="voice-preview-actions">
            {recordedDuration > 0 && (
              <span className="voice-preview-length-tag">
                ⏱️ {formatTimer(recordedDuration)} recorded
              </span>
            )}
            <button
              type="button"
              className="btn-subtle-pill"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={handleReset}
              title="Delete and re-record"
            >
              🗑️ Delete & Re-record
            </button>
          </div>
        </div>
      )}

      {/* Fallback Audio File Upload */}
      {showFileUpload && !audioUrl && !isRecording && (
        <div className="voice-file-fallback">
          <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Choose an audio recording from your phone / computer (.webm, .mp3, .wav, .m4a):
          </label>
          <input
            type="file"
            accept="audio/*"
            className="input"
            onChange={handleFileUpload}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
