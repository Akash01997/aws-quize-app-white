import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const TIMER_SECONDS = 5;
const OPTION_APPEAR_DELAY = 700;
const QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://aws.amazon.com/training/quiz';

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const quizData = location.state?.quizData;
  const [qIndex, setQIndex] = useState(0);
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [phase, setPhase] = useState('options');
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [progress, setProgress] = useState(100);
  const [typedText, setTypedText] = useState('');
  const [showExplanationScreen, setShowExplanationScreen] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const timerRef = useRef();
  const typingRef = useRef();
  const question = quizData?.[qIndex];

  // Calculate content density for dynamic layout with aggressive screen utilization
  const getContentDensity = () => {
    if (!question) return 'medium';
    
    const questionLength = question.question?.length || 0;
    const totalOptionsLength = question.options?.reduce((sum, opt) => sum + (opt?.length || 0), 0) || 0;
    const averageOptionLength = totalOptionsLength / (question.options?.length || 1);
    const totalContentLength = questionLength + totalOptionsLength;
    const maxOptionLength = Math.max(...(question.options?.map(opt => opt?.length || 0) || [0]));
    const minOptionLength = Math.min(...(question.options?.map(opt => opt?.length || 0) || [1]));
    
    // Aggressive detection for maximum screen utilization
    if (totalContentLength < 150 && averageOptionLength < 20 && maxOptionLength < 35) {
      return 'compact'; // Very short content - enlarge and center
    } else if (totalContentLength > 400 || averageOptionLength > 40 || maxOptionLength > 80 || 
               (questionLength > 200)) {
      return 'dense'; // Long content - compact and space-efficient
    } else {
      return 'medium'; // Normal content - balanced
    }
  };

  const contentDensity = getContentDensity();

  // Listen for quiz data from video exporter
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'QUIZ_DATA') {
        // Handle external quiz data
        console.log('Received quiz data for video recording:', event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!quizData) navigate('/');
  }, [quizData, navigate]);

  useEffect(() => {
    setVisibleOptions([]);
    setPhase('options');
    setTimer(TIMER_SECONDS);
    setProgress(100);
    setShowTransition(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!question) return;
    question.options.forEach((_, i) => {
      setTimeout(() => {
        setVisibleOptions((prev) => [...prev, i]);
      }, OPTION_APPEAR_DELAY * (i + 1));
    });
  }, [qIndex, quizData]);

  useEffect(() => {
    if (!question) return;
    if (phase === 'options' && visibleOptions.length === question.options.length) {
      setPhase('timer');
    }
  }, [visibleOptions, phase, question]);

  useEffect(() => {
    if (!question) return;
    if (phase !== 'timer') return;
    setTimer(TIMER_SECONDS);
    setProgress(100);
    if (timerRef.current) clearInterval(timerRef.current);
    let elapsedMs = 0;
    let totalMs = TIMER_SECONDS * 1000;
    let localTimer = TIMER_SECONDS;
    timerRef.current = setInterval(() => {
      elapsedMs += 100;
      let percent = Math.max(0, 100 - (elapsedMs / totalMs) * 100);
      setProgress(percent);
      if (elapsedMs % 1000 === 0) {
        localTimer--;
        setTimer(localTimer);
      }
      if (elapsedMs >= totalMs) {
        setProgress(0);
        setTimer(0);
        setPhase('answer');
        clearInterval(timerRef.current);
      }
    }, 100);
    return () => {
      clearInterval(timerRef.current);
    };
  }, [phase, question]);

  useEffect(() => {
    if (phase !== 'answer') return;
    const timeout = setTimeout(() => {
      if (question?.explanation) {
        setShowExplanationScreen(true);
        setPhase('explanation');
      } else {
        setPhase('explanation');
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [phase, question]);

  useEffect(() => {
    if (phase !== 'explanation') return;
    
    if (question?.explanation && showExplanationScreen) {
      // Show explanation instantly, no typing effect
      setTypedText(question.explanation);
      
      // Wait 4 seconds, then show transition, then move to next question
      const timeout = setTimeout(() => {
        if (qIndex < quizData.length - 1) {
          setShowTransition(true);
          setTimeout(() => {
            setShowExplanationScreen(false);
            setQIndex(qIndex + 1);
          }, 1000); // 1 second transition
        }
      }, 4000);
      
      return () => clearTimeout(timeout);
    } else {
      // No explanation, just move to next question after delay
      const timeout = setTimeout(() => {
        if (qIndex < quizData.length - 1) {
          setShowTransition(true);
          setTimeout(() => {
            setQIndex(qIndex + 1);
          }, 1000);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [phase, qIndex, quizData, question, showExplanationScreen]);

  // Debug: log phase and content density
  if (typeof window !== 'undefined') {
    const questionLength = question?.question?.length || 0;
    const totalOptionsLength = question?.options?.reduce((sum, opt) => sum + (opt?.length || 0), 0) || 0;
    const averageOptionLength = totalOptionsLength / (question.options?.length || 1);
    const maxOptionLength = Math.max(...(question.options?.map(opt => opt?.length || 0) || [0]));
    
    // eslint-disable-next-line no-console
    console.log('📊 Content Analysis:', {
      phase,
      contentDensity,
      questionLength,
      totalOptionsLength,
      averageOptionLength: Math.round(averageOptionLength),
      maxOptionLength,
      totalContent: questionLength + totalOptionsLength
    });
  }

  if (!quizData || !question) {
    return <div style={{ fontSize: 32, color: '#888', margin: 'auto' }}>No questions found.</div>;
  }

  // Transition Screen Component
  if (showTransition) {
    return (
      <div className="ppt-transition-screen">
        <div className="ppt-transition-content">
          <div className="ppt-transition-icon">🚀</div>
          <div className="ppt-transition-text">Next Question Loading...</div>
          <div className="ppt-transition-counter">
            Question {qIndex + 2} of {quizData.length}
          </div>
          <div className="ppt-transition-bar">
            <div className="ppt-transition-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  // Explanation Screen Component
  if (showExplanationScreen && question?.explanation) {
    const explanationDensity = question.explanation.length > 300 ? 'dense' : 
                              question.explanation.length < 100 ? 'compact' : 'medium';
    
    return (
      <div className={`ppt-explanation-screen ${explanationDensity}-explanation`}>
        <div className="ppt-explanation-content">
          <div className="ppt-explanation-header">
            <span>💡</span>
            <span>Explanation</span>
          </div>
          <div className="ppt-explanation-text-container">
            <div className={`ppt-explanation-typing ${explanationDensity}-explanation-text`}>
              {typedText}
            </div>
          </div>
          <div className="ppt-explanation-footer">
            📺 Subscribe to our YouTube channel for more AWS content!
          </div>
          <div className="ppt-explanation-progress">
            Question {qIndex + 1} of {quizData.length} • {Math.round(((qIndex + 1) / quizData.length) * 100)}% Complete
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ppt-bg">
      <div className={`ppt-main-row ${contentDensity}-content`}>
        <div className={`ppt-col-left ${contentDensity}-layout`}>
          <div className="ppt-timer-bar-outer">
            <div
              className="ppt-timer-bar-inner"
              style={{
                width: `${progress}%`,
                background: progress > 30 ? '#22d06c' : '#f7c873',
                transition: 'width 0.1s linear, background 0.3s'
              }}
            />
          </div>
          <div className={`ppt-question ${contentDensity}-question`}>
            <span className="ppt-question-number">Question #{qIndex + 1}: {contentDensity === 'compact' ? '🎯' : contentDensity === 'dense' ? '📚' : '📝'}</span>
            <span className="ppt-question-text">{question.question}</span>
          </div>
          <div className={`ppt-options ${contentDensity}-options`}>
            {question.options.map((opt, i) => {
              const isCorrect = (phase === 'answer' || phase === 'explanation') && 
                question.answer?.trim()?.toLowerCase() === opt?.trim()?.toLowerCase();
              const letters = ['A', 'B', 'C', 'D'];
              
              return (
                <div
                  key={i}
                  className={
                    `ppt-option ${contentDensity}-option` +
                    (isCorrect ? ' correct' : '') +
                    (visibleOptions.includes(i) ? ' visible' : ' hidden')
                  }
                  style={{
                    opacity: visibleOptions.includes(i) ? 1 : 0,
                    transition: 'opacity 0.4s'
                  }}
                >
                  <span className="ppt-option-letter">{letters[i]}.</span>
                  <span className="ppt-option-text">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="ppt-col-right">
          <div className="ppt-qr-block">
            <span className="ppt-qr-label">Join WhatsApp Group</span>
            <img className="ppt-qr-img" src={QR_URL} alt="WhatsApp QR" />
            <div className="ppt-qr-subtitle">Get Study Materials</div>
          </div>
          <div className="ppt-progress-counter">
            <div className="ppt-progress-text">
              Question {qIndex + 1} of {quizData.length}
            </div>
            <div className="ppt-progress-bar">
              <div 
                className="ppt-progress-fill"
                style={{
                  width: `${((qIndex + 1) / quizData.length) * 100}%`
                }}
              ></div>
            </div>
          </div>
          <div className="ppt-marketing-text">
            <div className="ppt-marketing-title">🚀 Join Our Programs</div>
            <div className="ppt-marketing-subtitle">Complete AWS Preparation</div>
            <div className="ppt-marketing-cta">Live Classes • Mock Tests • Career Support</div>
          </div>
        </div>
      </div>
      <div className="ppt-footer">
        📺 Subscribe to our YouTube channel for more AWS content!
      </div>
    </div>
  );
}