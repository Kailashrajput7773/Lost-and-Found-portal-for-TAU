import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ audioSrc, title = 'Voice Message', initialDuration = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    initialDuration && isFinite(initialDuration) && initialDuration > 0 ? initialDuration : 0
  );
  const audioRef = useRef(null);

  // Resolve absolute or relative URL
  const resolvedSrc = audioSrc
    ? (audioSrc.startsWith('http') || audioSrc.startsWith('data:') || audioSrc.startsWith('blob:')
        ? audioSrc
        : `http://localhost:5001${audioSrc}`)
    : '';

  // Update duration if initialDuration changes from parent
  useEffect(() => {
    if (initialDuration && isFinite(initialDuration) && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  // Decode exact duration from Web Audio API for blobs or data URLs
  useEffect(() => {
    if (!resolvedSrc || (!resolvedSrc.startsWith('blob:') && !resolvedSrc.startsWith('data:'))) {
      return;
    }

    let isMounted = true;

    const calculateAudioBufferDuration = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const resp = await fetch(resolvedSrc);
        const arrayBuffer = await resp.arrayBuffer();
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        
        if (isMounted && decoded && isFinite(decoded.duration) && decoded.duration > 0) {
          setDuration(decoded.duration);
        }
        ctx.close();
      } catch (err) {
        // Fallback to media element
      }
    };

    calculateAudioBufferDuration();

    return () => {
      isMounted = false;
    };
  }, [resolvedSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);

      // Dynamically expand duration if audio plays past recorded estimate
      setDuration(prev => {
        if (!isFinite(prev) || prev <= 0) {
          return cur;
        }
        return Math.max(prev, cur);
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;

    if (isFinite(d) && d > 0) {
      setDuration(d);
    } else if (d === Infinity) {
      // Chromium WebM duration missing quirk fix:
      // Seeking to an arbitrarily high number prompts Chrome to calculate the finite stream duration
      audioRef.current.currentTime = 1e101;
      audioRef.current.ontimeupdate = function () {
        this.ontimeupdate = null;
        if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
          setDuration(audioRef.current.duration);
        }
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      };
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (!isFinite(newTime)) return;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs <= 0) return '0:00';
    const totalSecs = Math.round(secs);
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Ensure effectiveDuration is finite and positive
  const effectiveDuration = isFinite(duration) && duration > 0 
    ? duration 
    : (isFinite(initialDuration) && initialDuration > 0 ? initialDuration : 1);

  const progress = effectiveDuration > 0 
    ? Math.min(100, (currentTime / effectiveDuration) * 100) 
    : 0;

  if (!audioSrc) return null;

  return (
    <div className="audio-player-widget">
      <audio
        ref={audioRef}
        src={resolvedSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="audio-player-main">
        <button
          type="button"
          className="audio-play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play voice message'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="audio-player-info">
          <div className="audio-player-header">
            <span className="audio-player-title">🎙️ {title}</span>
            <span className="audio-player-timer">
              {formatTime(currentTime)} / {formatTime(effectiveDuration)}
            </span>
          </div>

          <div className="audio-progress-wrap">
            <input
              type="range"
              min="0"
              max={effectiveDuration}
              step="0.05"
              value={Math.min(currentTime, effectiveDuration)}
              onChange={handleSeek}
              className="audio-progress-slider"
              style={{
                background: `linear-gradient(to right, var(--brand-primary) ${progress}%, var(--border-subtle) ${progress}%)`
              }}
            />
          </div>
        </div>

        {/* Animated Soundwave bars when playing */}
        <div className={`audio-soundwave ${isPlaying ? 'active' : ''}`}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
