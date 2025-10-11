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
  const timerRef = useRef();
  const question = quizData?.[qIndex];

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
      setPhase('explanation');
    }, 2000);
    return () => clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'explanation') return;
    const timeout = setTimeout(() => {
      if (qIndex < quizData.length - 1) {
        setQIndex(qIndex + 1);
      }
    }, 3500);
    return () => clearTimeout(timeout);
  }, [phase, qIndex, quizData]);

  // Debug: log phase and explanation (must be after hooks and variable declarations)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('phase:', phase, 'explanation:', question && question.explanation);
  }

  if (!quizData || !question) {
    return <div style={{ fontSize: 32, color: '#888', margin: 'auto' }}>No questions found.</div>;
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
            {question.options.map((opt, i) => (
              <div
                key={i}
                className={
                  'ppt-option' +
                  ((phase === 'answer' || phase === 'explanation') && (
  Array.isArray(question.answer)
    ? question.answer.includes(opt)
    : opt === question.answer
) ? ' correct' : '') +
                  (visibleOptions.includes(i) ? ' visible' : ' hidden')
                }
                style={{
                  opacity: visibleOptions.includes(i) ? 1 : 0,
                  transition: 'opacity 0.4s'
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
        <div className="ppt-col-right">
          {phase === 'explanation' && (
            <div className="ppt-explanation-box">
              <div className="ppt-explanation-title">Explanation</div>
              <div className="ppt-explanation-text">
                {question.explanation || <span style={{color:'red'}}>No explanation provided.</span>}
              </div>
            </div>
          )}
          <div className="ppt-qr-block">
            <span className="ppt-qr-label">Join our AWS Quiz</span>
            <img className="ppt-qr-img" src={QR_URL} alt="QR" />
          </div>
        </div>
      </div>
      <div className="ppt-footer">
        Learn AWS with our Quiz
      </div>
    </div>
  );
}
