import React, { useState } from 'react';

export default function VideoExporter({ quizData, onComplete }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const exportToVideo = async () => {
    if (!quizData || quizData.length === 0) {
      alert('No quiz data available for export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setCurrentStep('Creating video...');

    try {
      // Create canvas for video generation
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      // Create video stream
      const stream = canvas.captureStream(30);
      const chunks = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-video-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        setIsExporting(false);
        setExportProgress(100);
        setCurrentStep('Video downloaded!');
        
        if (onComplete) onComplete(blob);
      };

      mediaRecorder.start();

      // Generate video content
      await generateVideo(canvas, ctx);

      mediaRecorder.stop();

    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setCurrentStep('Export failed');
      alert('Export failed: ' + error.message);
    }
  };

  const generateVideo = async (canvas, ctx) => {
    const frameRate = 30;
    const TIMER_SECONDS = 10;
    const OPTION_APPEAR_DELAY = 700;
    
    // Process each question with exact QuizPage flow
    for (let i = 0; i < quizData.length; i++) {
      const question = quizData[i];
      setExportProgress((i / quizData.length) * 90);
      setCurrentStep(`Processing question ${i + 1} of ${quizData.length}`);

      // Phase 1: Show question and animate options appearing (2.8 seconds)
      const optionFrames = Math.ceil((OPTION_APPEAR_DELAY * question.options.length) / 1000 * frameRate);
      for (let frame = 0; frame < optionFrames; frame++) {
        const timeElapsed = (frame / frameRate) * 1000;
        const visibleOptions = [];
        
        // Calculate which options should be visible based on delay
        for (let optIndex = 0; optIndex < question.options.length; optIndex++) {
          if (timeElapsed >= OPTION_APPEAR_DELAY * (optIndex + 1)) {
            visibleOptions.push(optIndex);
          }
        }
        
        drawQuestionPhase(ctx, canvas, question, i + 1, visibleOptions, 100, 'options');
        await sleep(1000 / frameRate);
      }

      // Phase 2: Timer countdown (10 seconds)
      const timerFrames = frameRate * TIMER_SECONDS;
      for (let frame = 0; frame < timerFrames; frame++) {
        const progress = Math.max(0, 100 - (frame / timerFrames) * 100);
        const allOptions = question.options.map((_, idx) => idx);
        
        drawQuestionPhase(ctx, canvas, question, i + 1, allOptions, progress, 'timer');
        await sleep(1000 / frameRate);
      }

      // Phase 3: Show answer (2 seconds)
      const answerFrames = frameRate * 2;
      for (let frame = 0; frame < answerFrames; frame++) {
        const allOptions = question.options.map((_, idx) => idx);
        drawQuestionPhase(ctx, canvas, question, i + 1, allOptions, 0, 'answer');
        await sleep(1000 / frameRate);
      }

      // Phase 4: Explanation screen (if exists, 6 seconds with typing effect)
      if (question.explanation) {
        const explanationFrames = frameRate * 6;
        for (let frame = 0; frame < explanationFrames; frame++) {
          const progress = frame / explanationFrames;
          drawExplanationScreen(ctx, canvas, question, i + 1, progress);
          await sleep(1000 / frameRate);
        }
      }
    }

    setExportProgress(100);
    setCurrentStep('Video complete!');
  };

  const drawQuestionPhase = (ctx, canvas, question, questionNum, visibleOptions, timerProgress, phase) => {
    // Clear canvas with white background (matching .ppt-bg)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate responsive dimensions (scale for 1920x1080)
    const scale = canvas.width / 1920;
    const padding = 30 * scale;
    const rightColumnWidth = 180 * scale;
    const contentWidth = canvas.width - padding * 2 - rightColumnWidth;

    // Timer bar (matching .ppt-timer-bar-outer and .ppt-timer-bar-inner)
    const timerBarY = 40 * scale;
    const timerBarHeight = 8 * scale;
    const timerBarWidth = contentWidth;
    
    // Timer bar background
    ctx.fillStyle = '#e5e7eb';
    roundRect(ctx, padding, timerBarY, timerBarWidth, timerBarHeight, 6 * scale);
    ctx.fill();
    
    // Timer bar fill
    const timerColor = timerProgress > 30 ? '#22d06c' : '#f7c873';
    ctx.fillStyle = timerColor;
    const fillWidth = timerBarWidth * (timerProgress / 100);
    roundRect(ctx, padding, timerBarY, fillWidth, timerBarHeight, 6 * scale);
    ctx.fill();

    // Question text (matching .ppt-question)
    const questionY = timerBarY + timerBarHeight + 25 * scale;
    ctx.fillStyle = '#181818';
    ctx.font = `600 ${Math.max(24, 48 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Wrap question text
    const questionLines = wrapTextToLines(ctx, question.question, contentWidth, Math.max(28, 56 * scale));
    questionLines.forEach((line, index) => {
      ctx.fillText(line, padding, questionY + (index * Math.max(28, 56 * scale)));
    });

    // Options grid (matching .ppt-options)
    const optionsStartY = questionY + (questionLines.length * Math.max(28, 56 * scale)) + 25 * scale;
    const optionsPerRow = canvas.width > 900 * scale ? 2 : 1;
    const optionWidth = optionsPerRow === 2 ? (contentWidth - 12 * scale) / 2 : contentWidth;
    const optionHeight = 45 * scale;
    const optionGap = 12 * scale;

    question.options.forEach((option, index) => {
      const row = Math.floor(index / optionsPerRow);
      const col = index % optionsPerRow;
      const x = padding + (col * (optionWidth + optionGap));
      const y = optionsStartY + (row * (optionHeight + optionGap));
      
      const isVisible = visibleOptions.includes(index);
      const isCorrect = (phase === 'answer') && 
        question.answer?.trim()?.toLowerCase() === option?.trim()?.toLowerCase();
      
      if (isVisible) {
        // Option background
        if (isCorrect) {
          ctx.fillStyle = '#e8f5e8';
          ctx.strokeStyle = '#1a7f37';
          ctx.lineWidth = 2 * scale;
        } else {
          ctx.fillStyle = '#f7f8fa';
          ctx.strokeStyle = 'transparent';
        }
        
        roundRect(ctx, x, y, optionWidth, optionHeight, 8 * scale);
        ctx.fill();
        
        if (isCorrect) {
          ctx.stroke();
        }
        
        // Option text
        ctx.fillStyle = isCorrect ? '#1a7f37' : '#181818';
        ctx.font = `${isCorrect ? '700' : '500'} ${Math.max(16, 24 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        let optionText = option;
        if (isCorrect) {
          optionText = '✓ ' + option;
        }
        
        // Wrap option text if needed
        const optionLines = wrapTextToLines(ctx, optionText, optionWidth - 32 * scale, Math.max(18, 28 * scale));
        const totalTextHeight = optionLines.length * Math.max(18, 28 * scale);
        const startY = y + (optionHeight - totalTextHeight) / 2 + Math.max(9, 14 * scale);
        
        optionLines.forEach((line, lineIndex) => {
          ctx.fillText(line, x + 16 * scale, startY + (lineIndex * Math.max(18, 28 * scale)));
        });
      }
    });

    // Right column - QR Code area (matching .ppt-col-right)
    const rightX = canvas.width - rightColumnWidth;
    const qrBlockY = 40 * scale;
    const qrBlockWidth = 160 * scale;
    const qrBlockHeight = 120 * scale;
    
    // QR Block background (matching .ppt-qr-block)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, rightX, qrBlockY, qrBlockWidth, qrBlockHeight, 10 * scale);
    ctx.fill();
    
    // Add subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 16 * scale;
    ctx.shadowOffsetY = 4 * scale;
    roundRect(ctx, rightX, qrBlockY, qrBlockWidth, qrBlockHeight, 10 * scale);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // QR Label (matching .ppt-qr-label)
    ctx.fillStyle = '#222222';
    ctx.font = `600 ${Math.max(10, 14 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Join our AWS Quiz', rightX + qrBlockWidth/2, qrBlockY + 8 * scale);
    
    // QR Code placeholder (matching .ppt-qr-img)
    const qrSize = 80 * scale;
    const qrX = rightX + (qrBlockWidth - qrSize) / 2;
    const qrY = qrBlockY + 25 * scale;
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 6 * scale);
    ctx.fill();
    ctx.stroke();
    
    // QR Code pattern (simple placeholder)
    ctx.fillStyle = '#222222';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          const cellSize = qrSize / 8;
          ctx.fillRect(qrX + i * cellSize, qrY + j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Progress counter (matching .ppt-progress-counter)
    const progressY = qrBlockY + qrBlockHeight + 15 * scale;
    const progressHeight = 60 * scale;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, rightX, progressY, qrBlockWidth, progressHeight, 8 * scale);
    ctx.fill();
    
    // Progress text (matching .ppt-progress-text)
    ctx.fillStyle = '#374151';
    ctx.font = `600 ${Math.max(10, 14 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Question ${questionNum} of ${quizData.length}`, rightX + qrBlockWidth/2, progressY + 12 * scale);
    
    // Progress bar (matching .ppt-progress-bar)
    const progressBarY = progressY + 25 * scale;
    const progressBarWidth = qrBlockWidth - 20 * scale;
    const progressBarHeight = 4 * scale;
    
    // Progress bar background
    ctx.fillStyle = '#e5e7eb';
    roundRect(ctx, rightX + 10 * scale, progressBarY, progressBarWidth, progressBarHeight, 2 * scale);
    ctx.fill();
    
    // Progress bar fill
    const gradient = ctx.createLinearGradient(rightX + 10 * scale, 0, rightX + 10 * scale + progressBarWidth, 0);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    const progressFillWidth = progressBarWidth * (questionNum / quizData.length);
    roundRect(ctx, rightX + 10 * scale, progressBarY, progressFillWidth, progressBarHeight, 2 * scale);
    ctx.fill();

    // Footer (matching .ppt-footer)
    const footerHeight = 50 * scale;
    const footerY = canvas.height - footerHeight;
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, footerY, canvas.width, footerHeight);
    
    // Footer border
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, footerY, canvas.width, 2 * scale);
    
    // Footer text
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.max(14, 20 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Learn AWS with our Quiz', canvas.width / 2, footerY + footerHeight / 2);
  };

  const drawExplanationScreen = (ctx, canvas, question, questionNum, progress) => {
    // Background gradient (matching .ppt-explanation-screen)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale for responsive design
    const scale = canvas.width / 1920;
    
    // Content container (matching .ppt-explanation-content)
    const containerWidth = Math.min(800 * scale, canvas.width * 0.9);
    const containerHeight = 400 * scale;
    const containerX = (canvas.width - containerWidth) / 2;
    const containerY = (canvas.height - containerHeight) / 2;
    
    // Container background with backdrop blur effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 20 * scale);
    ctx.fill();
    
    // Container shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 60 * scale;
    ctx.shadowOffsetY = 20 * scale;
    roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 20 * scale);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Header (matching .ppt-explanation-header)
    const headerY = containerY + 40 * scale;
    ctx.fillStyle = '#1e293b';
    ctx.font = `700 ${Math.max(28, 42 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('💡 Explanation', containerX + containerWidth / 2, headerY);

    // Text container (matching .ppt-explanation-text-container)
    const textContainerY = headerY + 60 * scale;
    const textContainerHeight = 120 * scale;
    const textContainerPadding = 30 * scale;
    
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, containerX + textContainerPadding, textContainerY, 
              containerWidth - textContainerPadding * 2, textContainerHeight, 12 * scale);
    ctx.fill();
    
    // Left border accent
    ctx.fillStyle = '#10b981';
    ctx.fillRect(containerX + textContainerPadding, textContainerY, 5 * scale, textContainerHeight);

    // Typing effect for explanation text
    const explanation = question.explanation || '';
    const totalChars = explanation.length;
    const visibleChars = Math.floor(progress * totalChars);
    const visibleText = explanation.slice(0, visibleChars);
    
    // Explanation text (matching .ppt-explanation-typing)
    ctx.fillStyle = '#374151';
    ctx.font = `500 ${Math.max(18, 26 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const textX = containerX + textContainerPadding + 25 * scale;
    const textY = textContainerY + 25 * scale;
    const textWidth = containerWidth - textContainerPadding * 2 - 50 * scale;
    
    const explanationLines = wrapTextToLines(ctx, visibleText, textWidth, Math.max(22, 32 * scale));
    explanationLines.forEach((line, index) => {
      ctx.fillText(line, textX, textY + (index * Math.max(22, 32 * scale)));
    });
    
    // Typing cursor
    if (visibleChars < totalChars && Math.floor(progress * 20) % 2 === 0) {
      const lastLine = explanationLines[explanationLines.length - 1] || '';
      const cursorX = textX + ctx.measureText(lastLine).width + 2 * scale;
      const cursorY = textY + ((explanationLines.length - 1) * Math.max(22, 32 * scale));
      
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cursorX, cursorY, 2 * scale, Math.max(20, 30 * scale));
    }

    // Footer text (matching .ppt-explanation-footer)
    const footerY = textContainerY + textContainerHeight + 30 * scale;
    ctx.fillStyle = '#64748b';
    ctx.font = `500 ${Math.max(16, 22 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    
    const footerText = visibleChars >= totalChars ? 
      "Moving to next question..." : 
      "Reading explanation...";
    ctx.fillText(footerText, containerX + containerWidth / 2, footerY);

    // Progress indicator (matching .ppt-explanation-progress)
    const progressTextY = footerY + 30 * scale;
    ctx.fillStyle = '#9ca3af';
    ctx.font = `600 ${Math.max(14, 18 * scale)}px Inter, 'Segoe UI', Arial, sans-serif`;
    ctx.fillText(
      `Question ${questionNum} of ${quizData.length} • ${Math.round((questionNum / quizData.length) * 100)}% Complete`,
      containerX + containerWidth / 2,
      progressTextY
    );
  };

  // Helper function for rounded rectangles
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper function for text wrapping
  const wrapTextToLines = (ctx, text, maxWidth, lineHeight) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🎬</span>
        <span>Generate Quiz Video</span>
      </div>
      
      <div style={styles.description}>
        Create a professional quiz video with your exact styling and animations!
      </div>

      {!isExporting ? (
        <button onClick={exportToVideo} style={styles.exportButton}>
          🎥 Generate Video
        </button>
      ) : (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${exportProgress}%`
              }}
            />
          </div>
          <div style={styles.progressText}>
            {Math.round(exportProgress)}% - {currentStep}
          </div>
        </div>
      )}

      <div style={styles.features}>
        <div style={styles.feature}>✅ Professional styling</div>
        <div style={styles.feature}>✅ Animated timer</div>
        <div style={styles.feature}>✅ HD 1080p output</div>
        <div style={styles.feature}>✅ YouTube ready</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '25px 30px',
    borderRadius: '16px',
    marginTop: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  header: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '24px'
  },
  description: {
    fontSize: '14px',
    marginBottom: '20px',
    opacity: 0.9,
    lineHeight: '1.5'
  },
  exportButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
  },
  progressContainer: {
    marginBottom: '20px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '5px'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    fontSize: '13px'
  },
  feature: {
    opacity: 0.9
  }
};
