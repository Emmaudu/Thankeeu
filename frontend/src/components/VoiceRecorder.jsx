import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Icon from './ui/Icon';

const VoiceRecorder = ({ onRecorded, disabled = false }) => {
  const recorderRef  = useRef(null);
  const streamRef    = useRef(null);
  const timerRef     = useRef(null);
  const chunksRef    = useRef([]);
  const mountedRef   = useRef(true);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds]     = useState(0);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    // React StrictMode mounts, cleans up, and mounts effects again in
    // development. Reset this flag during setup so completed recordings are
    // still delivered after that lifecycle check.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.clearInterval(timerRef.current);
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      stopTracks();
    };
  }, []);

  const startRecording = async () => {
    // 1. Browser support check
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error('Voice recording is not supported in this browser. Please use Chrome or Firefox.', { duration: 5000 });
      return;
    }
    // 2. HTTPS check — getUserMedia is blocked on HTTP (except localhost)
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (window.location.protocol === 'http:' && !isLocalhost) {
      toast.error(
        'Voice recording requires a secure (HTTPS) connection. Please access this page via https://',
        { duration: 7000 }
      );
      return;
    }

    try {
      // 3. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const preferredType = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ].find(t => MediaRecorder.isTypeSupported(t));

      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      streamRef.current  = stream;
      recorderRef.current = recorder;
      chunksRef.current  = [];
      setSeconds(0);

      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const mimeType  = recorder.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `thankeeu-voice-${Date.now()}.${extension}`, { type: mimeType });
        if (mountedRef.current) onRecorded(file);
        stopTracks();
      };

      recorder.start(250);
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setSeconds(v => {
          if (v >= 119) {
            recorder.stop();
            window.clearInterval(timerRef.current);
            setRecording(false);
            return 120;
          }
          return v + 1;
        });
      }, 1000);

    } catch (err) {
      stopTracks();
      const name = err?.name || err?.constructor?.name || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error(
          'Microphone permission denied.\n\nOn desktop: open the site permissions in your browser address bar, allow Microphone, then refresh the page.',
          { duration: 8000 }
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.', { duration: 6000 });
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        toast.error('Microphone is in use by another app. Close other apps using the mic, then try again.', { duration: 6000 });
      } else if (name === 'SecurityError') {
        toast.error('Voice recording blocked by browser security. Make sure you are on HTTPS.', { duration: 7000 });
      } else if (name === 'OverconstrainedError') {
        toast.error('Microphone settings not supported. Try a different browser.', { duration: 5000 });
      } else {
        // Generic fallback — most likely a desktop permission issue
        toast.error(
          'Could not access the microphone. On desktop or laptop, open site permissions from the browser address bar, set Microphone to Allow, then refresh and try again.',
          { duration: 9000 }
        );
      }
    }
  };

  const stopRecording = () => {
    window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  };

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={recording ? stopRecording : startRecording}
      className={`voice-record-button ${recording ? 'is-recording' : ''}`}
    >
      <span className="voice-record-icon"><Icon name={recording ? 'Square' : 'Mic'} size={14} /></span>
      <span>{recording ? `Stop  ${fmt(seconds)}` : 'Record voice note'}</span>
      {recording && <span className="voice-record-pulse" />}
    </button>
  );
};

export default VoiceRecorder;
