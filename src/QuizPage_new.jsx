import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Timer from './components/Timer';
import QuestionPanel from './components/QuestionPanel';
import OptionsPanel from './components/OptionsPanel';
import ExplanationScreen from './components/ExplanationScreen';
import useQuizLogic from './hooks/useQuizLogic';
import './QuizPage.css';

function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizData } = location.state || {};

  if (!quizData || quizData.length === 0) {
    return (
      <div className="quiz-container">
        <div className="error-message">No quiz data available. Please upload a CSV file first.</div>
      </div>
    );
  }

  const {
    currentQuestionIndex,
    showAnswer,
    showExplanation,
    timeLeft,
    displayedText,
    handleOptionClick,
    handleNextQuestion
  } = useQuizLogic(quizData, navigate);

  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1 className="quiz-title">AWS Solutions Architect Quiz</h1>
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {quizData.length}
        </div>
      </div>

      <Timer timeLeft={timeLeft} />

      <div className="quiz-content">
        {!showExplanation ? (
          <>
            <QuestionPanel 
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
            />
            <OptionsPanel 
              currentQuestion={currentQuestion}
              showAnswer={showAnswer}
              onOptionClick={handleOptionClick}
            />
          </>
        ) : (
          <ExplanationScreen 
            currentQuestion={currentQuestion}
            displayedText={displayedText}
            onNext={handleNextQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={quizData.length}
          />
        )}
      </div>
    </div>
  );
}

export default QuizPage;