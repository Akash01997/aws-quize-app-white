import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const TIMER_SECONDS = 10;
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
  const timerRef = useRef();
  const typingRef = useRef();
  const question = quizData?.[qIndex];

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
      // Start typing effect
      setTypedText('');
      const explanation = question.explanation;
      let currentIndex = 0;
      
      typingRef.current = setInterval(() => {
        if (currentIndex < explanation.length) {
          setTypedText(explanation.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingRef.current);
          // Wait 3 seconds after typing is complete, then move to next question
          setTimeout(() => {
            setShowExplanationScreen(false);
            if (qIndex < quizData.length - 1) {
              setQIndex(qIndex + 1);
            }
          }, 3000);
        }
      }, 50); // Type at 50ms per character
      
      return () => {
        if (typingRef.current) {
          clearInterval(typingRef.current);
        }
      };
    } else {
      // No explanation, just move to next question after delay
      const timeout = setTimeout(() => {
        if (qIndex < quizData.length - 1) {
          setQIndex(qIndex + 1);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [phase, qIndex, quizData, question, showExplanationScreen]);

  // Debug: log phase and explanation (must be after hooks and variable declarations)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('phase:', phase, 'question:', question?.question);
    // eslint-disable-next-line no-console
    console.log('answer:', question?.answer, 'options:', question?.options);
  }

  if (!quizData || !question) {
    return <div style={{ fontSize: 32, color: '#888', margin: 'auto' }}>No questions found.</div>;
  }

  // Explanation Screen Component
  if (showExplanationScreen && question?.explanation) {
    return (
      <div className="ppt-explanation-screen">
        <div className="ppt-explanation-content">
          <div className="ppt-explanation-header">
            <span>💡</span>
            <span>Explanation</span>
          </div>
          <div className="ppt-explanation-text-container">
            <div className="ppt-explanation-typing">
              {typedText}
              {typedText.length < question.explanation.length && (
                <span className="ppt-typing-cursor"></span>
              )}
            </div>
          </div>
          <div className="ppt-explanation-footer">
            {typedText.length >= question.explanation.length ? 
              "Moving to next question..." : 
              "Reading explanation..."
            }
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
      <div className="ppt-main-row">
        <div className="ppt-col-left">
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
          <div className="ppt-question">{question.question}</div>
          <div className="ppt-options">
            {question.options.map((opt, i) => {
              const isCorrect = (phase === 'answer' || phase === 'explanation') && 
                question.answer?.trim()?.toLowerCase() === opt?.trim()?.toLowerCase();
              
              return (
                <div
                  key={i}
                  className={
                    'ppt-option' +
                    (isCorrect ? ' correct' : '') +
                    (visibleOptions.includes(i) ? ' visible' : ' hidden')
                  }
                  style={{
                    opacity: visibleOptions.includes(i) ? 1 : 0,
                    transition: 'opacity 0.4s'
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
        <div className="ppt-col-right">
          <div className="ppt-qr-block">
            <span className="ppt-qr-label">Join our AWS Quiz</span>
            <img className="ppt-qr-img" src={QR_URL} alt="QR" />
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
        </div>
      </div>
      <div className="ppt-footer">
        Learn AWS with our Quiz
      </div>
    </div>
  );
}
