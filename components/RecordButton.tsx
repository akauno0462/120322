
import React, { useState, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';

export const RecordButton: React.FC = () => {
  const { gl } = useThree();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    const canvas = gl.domElement;
    
    // Capture stream at 30fps
    const stream = canvas.captureStream(30);
    
    // Prefer VP9 for better quality, fallback to default
    const mimeTypes = [
      'video/webm;codecs=vp9', 
      'video/webm;codecs=vp8', 
      'video/webm'
    ];
    let selectedMimeType = 'video/webm';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps high quality
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arix-christmas-tree-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      chunksRef.current = [];
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = recorder;

    // Automatically stop after 14 seconds (Approx one full Tree <-> Scatter cycle)
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 14000); 

  }, [gl]);

  return (
    <div 
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      <button
        onClick={isRecording ? undefined : startRecording}
        disabled={isRecording}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300 font-mono text-xs tracking-widest uppercase
          ${isRecording 
            ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white hover:border-white/50'
          }
        `}
      >
        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/70'}`} />
        {isRecording ? 'Recording (14s)...' : 'Record Loop'}
      </button>
    </div>
  );
};
