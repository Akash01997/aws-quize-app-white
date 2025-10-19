import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const TIMER_SECONDS = 25;
const OPTION_APPEAR_DELAY = 800;
const ANSWER_REVEAL_DELAY = 3000;
const EXPLANATION_DELAY = 5000;
const DEFAULT_QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://aws.amazon.com/training/quiz';

// Default AWS Quiz Questions
const DEFAULT_QUIZ_DATA = [
  {
    question: "What does AWS stand for?",
    options: ["Amazon Web Services", "Amazon Web Solutions", "Amazon World Services", "Amazon Web Systems"],
    answer: "Amazon Web Services",
    explanation: "AWS stands for Amazon Web Services, which is Amazon's comprehensive cloud computing platform."
  },
  {
    question: "Which AWS service is primarily used for object storage?",
    options: ["Amazon EBS", "Amazon S3", "Amazon EFS", "Amazon RDS"],
    answer: "Amazon S3",
    explanation: "Amazon S3 (Simple Storage Service) is AWS's object storage service that offers industry-leading scalability, data availability, security, and performance."
  },
  {
    question: "What is the default maximum number of VPCs per AWS region?",
    options: ["5", "10", "15", "20"],
    answer: "5",
    explanation: "By default, AWS allows up to 5 VPCs per region, though this limit can be increased by contacting AWS support."
  },
  {
    question: "Which AWS service provides a managed relational database?",
    options: ["Amazon DynamoDB", "Amazon S3", "Amazon RDS", "Amazon EC2"],
    answer: "Amazon RDS",
    explanation: "Amazon RDS (Relational Database Service) is a managed relational database service that supports multiple database engines."
  },
  {
    question: "What is AWS Lambda?",
    options: ["A storage service", "A serverless compute service", "A networking service", "A database service"],
    answer: "A serverless compute service",
    explanation: "AWS Lambda is a serverless compute service that runs code in response to events without provisioning or managing servers."
  },
  {
    question: "Which AWS service is used for content delivery and caching?",
    options: ["Amazon CloudFront", "Amazon S3", "Amazon EC2", "Amazon Route 53"],
    answer: "Amazon CloudFront",
    explanation: "Amazon CloudFront is AWS's content delivery network (CDN) service that delivers content with low latency and high transfer speeds."
  },
  {
    question: "What is the AWS Free Tier?",
    options: ["A premium support plan", "Free usage of AWS services within limits", "A training program", "A certification program"],
    answer: "Free usage of AWS services within limits",
    explanation: "The AWS Free Tier provides limited free usage of many AWS services for 12 months after account creation, plus some services that are always free."
  },
  {
    question: "Which AWS service is used for monitoring and logging?",
    options: ["Amazon CloudWatch", "Amazon S3", "Amazon EC2", "Amazon VPC"],
    answer: "Amazon CloudWatch",
    explanation: "Amazon CloudWatch is a monitoring service that provides data and actionable insights for AWS resources and applications."
  },
  {
    question: "What is Amazon EC2?",
    options: ["A storage service", "A database service", "A virtual server service", "A networking service"],
    answer: "A virtual server service",
    explanation: "Amazon EC2 (Elastic Compute Cloud) provides scalable virtual servers in the cloud, allowing you to run applications on AWS infrastructure."
  },
  {
    question: "Which AWS service provides DNS services?",
    options: ["Amazon CloudFront", "Amazon Route 53", "Amazon S3", "Amazon VPC"],
    answer: "Amazon Route 53",
    explanation: "Amazon Route 53 is AWS's scalable DNS service that routes traffic to AWS resources and external endpoints."
  }
];

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const csvQuizData = location.state?.quizData;
  
  console.log('QuizPage - Navigation state:', location.state);
  console.log('QuizPage - CSV quiz data received:', csvQuizData);
  
  // Use CSV data if available, otherwise use default questions
  const quizData = csvQuizData || DEFAULT_QUIZ_DATA;
  
  console.log('QuizPage - Final quiz data being used:', quizData);
  console.log('QuizPage - Using CSV data:', !!csvQuizData);
  
  // Get customization from UploadPage
  const customization = location.state?.customization || JSON.parse(localStorage.getItem('quizCustomization') || '{}');
  const {
    promotionLink = '',
    quizTitle = 'AWS Mastery Quiz',
    footerText = 'Powered by AWS Learning Hub',
    socialProofText = 'Join 50,000+ AWS professionals'
  } = customization;

  // Generate QR URL based on promotion link
  const getQRUrl = () => {
    if (promotionLink) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(promotionLink)}`;
    }
    return DEFAULT_QR_URL;
  };

  const qrUrl = getQRUrl();
  const [qIndex, setQIndex] = useState(0);
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [phase, setPhase] = useState('options');
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [progress, setProgress] = useState(100);
  const [showExplanationScreen, setShowExplanationScreen] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [animateCorrect, setAnimateCorrect] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const timerRef = useRef();
  const question = quizData?.[qIndex];

  // Calculate content density with premium algorithm
  // DIFFICULTY TAG LOGIC:
  // 🟢 Fundamental (compact): Simple questions with <25 complexity, short options (<40 chars)
  // 🟡 Intermediate (medium): Standard questions with balanced complexity (25-80)
  // 🔴 Expert (dense): Complex questions with >80 complexity, long options (>120 chars), or >300 char questions
  const getContentDensity = () => {
    if (!question) return 'medium';
    
    const questionLength = question.question?.length || 0;
    const totalOptionsLength = question.options?.reduce((sum, opt) => sum + (opt?.length || 0), 0) || 0;
    const averageOptionLength = totalOptionsLength / (question.options?.length || 1);
    const maxOptionLength = Math.max(...(question.options?.map(opt => opt?.length || 0) || [0]));
    const wordsPerQuestion = questionLength / 5; // Average word length
    const complexity = wordsPerQuestion + (averageOptionLength * 0.5);
    
    // Industry-standard content classification
    if (complexity < 25 && maxOptionLength < 40) {
      return 'compact'; // Bite-sized content - emphasize engagement
    } else if (complexity > 80 || maxOptionLength > 120 || questionLength > 300) {
      return 'dense'; // Complex content - optimize for comprehension
    } else {
      return 'medium'; // Standard content - balanced approach
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
    setShowCorrectAnswer(false);
    setAnimateCorrect(false);
    setQuestionStartTime(Date.now());
    if (timerRef.current) clearInterval(timerRef.current);
    if (!question) return;
    
    // Staggered option reveal with premium timing
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
    
    // Professional answer reveal sequence
    setShowCorrectAnswer(true);
    setTimeout(() => {
      setAnimateCorrect(true);
    }, 500);
    
    const timeout = setTimeout(() => {
      if (question?.explanation) {
        setShowExplanationScreen(true);
        setPhase('explanation');
      } else {
        // Move to next question if no explanation
        setTimeout(() => {
          if (qIndex < quizData.length - 1) {
            setQIndex(qIndex + 1);
          }
        }, 2000);
      }
    }, ANSWER_REVEAL_DELAY);
    
    return () => clearTimeout(timeout);
  }, [phase, question, qIndex, quizData]);

  useEffect(() => {
    if (phase !== 'explanation') return;
    
    if (question?.explanation && showExplanationScreen) {
      // Direct explanation display for recording
      const timeout = setTimeout(() => {
        if (qIndex < quizData.length - 1) {
          setShowExplanationScreen(false);
          setQIndex(qIndex + 1);
        }
      }, EXPLANATION_DELAY);
      
      return () => clearTimeout(timeout);
    }
  }, [phase, qIndex, quizData, question, showExplanationScreen]);

  // Professional analytics logging
  if (typeof window !== 'undefined' && question) {
    const questionLength = question?.question?.length || 0;
    const complexity = Math.round((questionLength / 5) + (question.options?.reduce((sum, opt) => sum + (opt?.length || 0), 0) / 20));
    
    // eslint-disable-next-line no-console
    console.log('🎯 Professional Quiz Analytics:', {
      phase,
      contentDensity,
      complexity,
      questionNumber: qIndex + 1,
      totalQuestions: quizData?.length || 0,
      progressPercentage: Math.round(((qIndex + 1) / (quizData?.length || 1)) * 100)
    });
  }

  if (!quizData || !question) {
    return (
      <div className="loading-state">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading AWS Quiz...</h2>
          <p>Preparing your personalized learning experience</p>
        </div>
      </div>
    );
  }

  // Premium Explanation Screen - YouTube Optimized
  if (showExplanationScreen && question?.explanation) {
    const explanationDensity = question.explanation.length > 400 ? 'dense' : 
                              question.explanation.length < 120 ? 'compact' : 'medium';
    
    return (
      <div className={`explanation-screen ${explanationDensity}-explanation`}>
        <div className="explanation-container">
          <div className="explanation-header">
            <div className="explanation-icon">
              <span className="icon-bulb">💡</span>
              <span className="explanation-label">Expert Explanation</span>
            </div>
            <div className="explanation-meta">
              <span className="question-progress">Question {qIndex + 1} of {quizData.length}</span>
              <div className="progress-indicator">
                <div className="progress-bar-mini" style={{width: `${((qIndex + 1) / quizData.length) * 100}%`}}></div>
              </div>
            </div>
          </div>
          
          <div className="explanation-content">
            <div className={`explanation-text ${explanationDensity}-text`}>
              {question.explanation}
            </div>
          </div>
          
          <div className="explanation-footer">
            <div className="footer-cta">
              <span className="cta-icon">🎯</span>
              <span>Subscribe for more AWS content & Join our community!</span>
            </div>
            <div className="footer-progress">
              <span className="progress-text">{Math.round(((qIndex + 1) / quizData.length) * 100)}% Complete</span>
              <span className="next-indicator">Next question loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for quiz data
  if (!quizData || quizData.length === 0 || !question) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '400px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️ No Quiz Data</h2>
          <p style={{ fontSize: '16px', marginBottom: '24px', opacity: '0.9' }}>
            No quiz questions are available. Please upload a CSV file or check your data.
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🏠 Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`quiz-container ${contentDensity}-mode`}>
      {/* Premium Header with Branding */}
      <div className="quiz-header">
        <div className="brand-section">
          <div className="brand-logo">
            <span className="aws-icon">☁️</span>
            <span className="brand-text">{quizTitle}</span>
          </div>
          <div className="difficulty-indicator">
            <span className={`difficulty-badge ${contentDensity}`}>
              {contentDensity === 'compact' ? '🟢 Fundamental' : 
               contentDensity === 'dense' ? '🔴 Expert' : '🟡 Intermediate'}
            </span>
          </div>
        </div>
        
        <div className="progress-section">
          <div className="question-counter">
            <span className="current">{qIndex + 1}</span>
            <span className="separator">/</span>
            <span className="total">{quizData.length}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${((qIndex + 1) / quizData.length) * 100}%` }}
              ></div>
            </div>
            <span className="progress-percentage">
              {Math.round(((qIndex + 1) / quizData.length) * 100)}%
            </span>
          </div>
        </div>
        
        <div className="timer-section">
          {phase === 'timer' ? (
            <div className="timer-display">
              <div className="timer-circle">
                <svg className="timer-svg" viewBox="0 0 36 36">
                  <path className="timer-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path 
                    className="timer-progress" 
                    strokeDasharray={`${progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                </svg>
                <div className="timer-text">{timer}s</div>
              </div>
            </div>
          ) : (
            <div className="phase-indicator">
              <span className="phase-icon">
                {phase === 'options' ? '⏳' : phase === 'answer' ? '✅' : '📖'}
              </span>
              <span className="phase-text">
                {phase === 'options' ? 'Think about it...' : 
                 phase === 'answer' ? 'Correct Answer' : 'Explanation'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="quiz-main">
        <div className="content-area">
          {/* Question Section */}
          <div className={`question-section ${contentDensity}-question`}>
            <div className="question-header">
              <span className="question-label">Question {qIndex + 1}</span>
              <div className="question-tags">
                <span className="tag aws">AWS</span>
                <span className="tag category">Cloud Computing</span>
              </div>
            </div>
            <div className="question-content">
              <h2 className="question-text">{question.question}</h2>
            </div>
          </div>

          {/* Options Section */}
          <div className={`options-section ${contentDensity}-options`}>
            {question.options.map((opt, i) => {
              const isCorrect = (phase === 'answer' || phase === 'explanation') && 
                question.answer?.trim()?.toLowerCase() === opt?.trim()?.toLowerCase();
              const letters = ['A', 'B', 'C', 'D'];
              const isVisible = visibleOptions.includes(i);
              
              return (
                <div
                  key={i}
                  className={`option-card ${contentDensity}-option
                    ${isCorrect && showCorrectAnswer ? ' correct' : ''}
                    ${isCorrect && animateCorrect ? ' animate-correct' : ''}
                    ${isVisible ? ' visible' : ' hidden'}`}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.6s ease ${i * 0.1}s`
                  }}
                >
                  <div className="option-indicator">
                    <span className="option-letter">{letters[i]}</span>
                    {isCorrect && showCorrectAnswer && (
                      <span className="correct-icon">✓</span>
                    )}
                  </div>
                  <div className="option-content">
                    <p className="option-text">{opt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-card whatsapp-card">
            <div className="card-header">
              <span className="card-icon">💬</span>
              <span className="card-title">Join Community</span>
            </div>
            <div className="qr-container">
              <img className="qr-code" src={qrUrl} alt={promotionLink ? "Promotion QR Code" : "WhatsApp Group QR"} />
              <p className="qr-description">
                {promotionLink ? "Scan for exclusive content!" : "Get instant updates & study materials"}
              </p>
            </div>
          </div>

          <div className="sidebar-card program-card">
            <div className="card-header">
              <span className="card-icon">🚀</span>
              <span className="card-title">AWS Programs</span>
            </div>
            <div className="program-content">
              <div className="program-feature">
                <span className="feature-icon">📚</span>
                <span>Complete Courses</span>
              </div>
              <div className="program-feature">
                <span className="feature-icon">🎯</span>
                <span>Mock Tests</span>
              </div>
              <div className="program-feature">
                <span className="feature-icon">👨‍🏫</span>
                <span>Expert Mentoring</span>
              </div>
              <div className="program-feature">
                <span className="feature-icon">🏆</span>
                <span>Career Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Progress Bar */}
      {phase === 'timer' && (
        <div className="timer-progress-container">
          <div 
            className="timer-progress-bar" 
            style={{ 
              width: `${progress}%`,
              backgroundColor: progress > 60 ? '#22c55e' : progress > 30 ? '#fbbf24' : '#ef4444'
            }}
          ></div>
        </div>
      )}

      {/* Premium Footer */}
      <div className="quiz-footer">
        <div className="footer-content">
          {promotionLink ? (
            <div className="subscribe-cta">
              <span className="cta-icon">�</span>
              <a 
                href={promotionLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="cta-text promotion-link"
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                {footerText}
              </a>
            </div>
          ) : (
            <div className="subscribe-cta">
              <span className="cta-icon">🔔</span>
              <span className="cta-text">{footerText}</span>
            </div>
          )}
          <div className="social-proof">
            <span className="proof-text">{socialProofText}</span>
            <div className="proof-indicators">
              <span className="indicator">🌟</span>
              <span className="indicator">🌟</span>
              <span className="indicator">🌟</span>
              <span className="indicator">🌟</span>
              <span className="indicator">🌟</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}