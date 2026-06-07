import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ onRecorded, disabled = false }) => {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const mountedRef = useRef(true);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    mountedRef.current = false;
    window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    stopTracks();
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error('Voice recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      setSeconds(0);

      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `thankeeu-voice-note-${Date.now()}.${extension}`, { type: mimeType });
        if (mountedRef.current) onRecorded(file);
        stopTracks();
      };

      recorder.start(250);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setSeconds(value => {
          if (value >= 119) {
            recorder.stop();
            window.clearInterval(timerRef.current);
            setRecording(false);
            return 120;
          }
          return value + 1;
        });
      }, 1000);
    } catch {
      toast.error('Microphone access is needed to record a voice note');
      stopTracks();
    }
  };

  const stopRecording = () => {
    window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={recording ? stopRecording : startRecording}
      className={`voice-record-button ${recording ? 'is-recording' : ''}`}
    >
      <span className="voice-record-icon">{recording ? '\u25A0' : '\uD83C\uDFA4'}</span>
      <span>{recording ? `Stop recording  ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Record voice note'}</span>
      {recording && <span className="voice-record-pulse" />}
    </button>
  );
};

export default VoiceRecorder;
