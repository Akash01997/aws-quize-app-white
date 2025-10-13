import React, { useState, useRef } from 'react';

export default function VideoRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Check if screen recording is supported
  React.useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = async () => {
    try {
      // Check if the API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Screen recording is not supported in this browser. Please use Chrome, Firefox, or Edge.');
        return;
      }

      // Request screen capture with better options
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: true // Request system audio
      });

      // Check if user cancelled the screen sharing
      if (!displayStream) {
        throw new Error('Screen sharing was cancelled by user');
      }

      streamRef.current = displayStream;
      chunksRef.current = [];

      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      // Try different MIME types for better compatibility
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4';
          }
        }
      }

      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(displayStream, {
        mimeType: mimeType
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' 
        });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `quiz-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        URL.revokeObjectURL(url);
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
        
        // Stop all tracks
        streamRef.current.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
        setIsPaused(false);
        clearInterval(timerRef.current);
      };

      // Handle stream ending (user stops sharing)
      displayStream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
        stopRecording();
      };

      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('Recording started successfully');

    } catch (err) {
      console.error('Error starting recording:', err);
      
      let errorMessage = 'Error starting recording. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please grant screen recording permission and try again.\n\nSteps:\n1. Click "Start Recording" again\n2. Select "Entire Screen" or "Application Window"\n3. Click "Share"';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No screen source found. Please try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Screen recording is not supported in this browser. Please use Chrome, Firefox, or Edge.';
      } else if (err.name === 'AbortError') {
        errorMessage += 'Screen sharing was cancelled. Click "Start Recording" again to try.';
      } else {
        errorMessage += err.message || 'Unknown error occurred. Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div style={styles.unsupported}>
        <p>🚫 Screen recording is not supported in this browser.</p>
        <p>Please use Chrome, Firefox, or Edge for video recording.</p>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div style={styles.instructions}>
        <div style={styles.instructionsHeader}>
          📹 How to Record Your Quiz
        </div>
        <div style={styles.instructionsList}>
          <div>1. Click "Start Recording" below</div>
          <div>2. Choose what to share:</div>
          <div style={{ marginLeft: '20px' }}>
            • <strong>Entire Screen</strong> - Records everything
          </div>
          <div style={{ marginLeft: '20px' }}>
            • <strong>Application Window</strong> - Records just this browser
          </div>
          <div>3. Click <strong>"Share"</strong> to begin recording</div>
          <div>4. Your quiz will be recorded automatically!</div>
        </div>
        <div style={styles.instructionsButtons}>
          <button onClick={startRecording} style={styles.startButton}>
            🎥 Start Recording Now
          </button>
          <button 
            onClick={() => setShowInstructions(false)} 
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        {!isRecording ? (
          <button 
            onClick={() => setShowInstructions(true)} 
            style={styles.startButton}
          >
            🎥 Start Recording Quiz
          </button>
        ) : (
          <div style={styles.recordingControls}>
            <button 
              onClick={pauseRecording} 
              style={isPaused ? styles.resumeButton : styles.pauseButton}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button onClick={stopRecording} style={styles.stopButton}>
              ⏹️ Stop & Download
            </button>
            <div style={styles.timer}>
              🔴 {formatTime(recordingTime)} {isPaused && '(Paused)'}
            </div>
          </div>
        )}
      </div>
      
      {isRecording && (
        <div style={styles.oldInstructions}>
          <p>📹 Recording in progress... The video will automatically download when you stop.</p>
          <p>💡 Tip: Make sure the quiz window is visible and properly sized!</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 10000,
    background: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    maxWidth: '350px'
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  startButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  recordingControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  pauseButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  resumeButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  stopButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  timer: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#ff4444',
    fontSize: '16px',
    marginTop: '5px'
  },
  instructions: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10001,
    background: 'rgba(0, 0, 0, 0.95)',
    color: 'white',
    padding: '30px 35px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(20px)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    maxWidth: '450px',
    width: '90vw'
  },
  instructionsHeader: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#10b981'
  },
  instructionsList: {
    lineHeight: '1.6',
    marginBottom: '25px'
  },
  instructionsButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  cancelButton: {
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  oldInstructions: {
    marginTop: '12px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: '1.4'
  },
  unsupported: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 10000,
    background: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    maxWidth: '300px'
  }
};