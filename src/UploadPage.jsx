import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import VideoRecorder from './VideoRecorder';
import VideoExporter from './VideoExporter';

export default function UploadPage() {
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      fileInputRef.current.files = e.dataTransfer.files;
      setFileName(file.name);
      setUploadError('');
    } else {
      setUploadError('Please drop a valid CSV file.');
    }
  };

  const handleSimulate = () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setUploadError('Please select a CSV file.');
      return;
    }
    
    setIsLoading(true);
    setUploadError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const { data, errors } = results;
              
              if (errors.length > 0) {
                setUploadError('Error parsing CSV file: ' + errors[0].message);
                setIsLoading(false);
                return;
              }
              
              if (!data || data.length === 0) {
                setUploadError('CSV file is empty or invalid.');
                setIsLoading(false);
                return;
              }
              
              // Validate required columns
              const requiredColumns = ['question_text', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_answer'];
              const firstRow = data[0];
              const missingColumns = requiredColumns.filter(col => !(col in firstRow));
              
              if (missingColumns.length > 0) {
                setUploadError(`Missing required columns: ${missingColumns.join(', ')}`);
                setIsLoading(false);
                return;
              }
              
              // Transform CSV data to quiz format
              const quizData = data.map((row, index) => {
                const options = [
                  row.option_1?.trim(),
                  row.option_2?.trim(),
                  row.option_3?.trim(),
                  row.option_4?.trim()
                ].filter(option => option && option.length > 0);
                
                if (options.length < 2) {
                  throw new Error(`Row ${index + 1}: At least 2 options are required`);
                }
                
                // Handle correct_answer as option number (1, 2, 3, 4)
                const correctAnswerIndex = parseInt(row.correct_answer?.trim()) - 1; // Convert to 0-based index
                let correctAnswer = null;
                
                if (correctAnswerIndex >= 0 && correctAnswerIndex < options.length) {
                  correctAnswer = options[correctAnswerIndex];
                } else {
                  // Fallback: try to match the correct_answer text directly
                  correctAnswer = row.correct_answer?.trim();
                }
                
                return {
                  question: row.question_text?.trim() || `Question ${index + 1}`,
                  options: options,
                  answer: correctAnswer,
                  explanation: row.explanation?.trim() || null,
                  topic_id: row.topic_id || null,
                  question_id: row.question_id || index + 1
                };
              });
              
              if (quizData.length === 0) {
                setUploadError('No valid questions found in CSV file.');
                setIsLoading(false);
                return;
              }
              
              // Store quiz data for export option
              setQuizData(quizData);
              setIsLoading(false);
              
            } catch (err) {
              setUploadError('Error processing CSV data: ' + err.message);
              setIsLoading(false);
            }
          },
          error: (error) => {
            setUploadError('Could not parse CSV file: ' + error.message);
            setIsLoading(false);
          }
        });
      } catch (err) {
        setUploadError('Could not read CSV file. Please check your file format.');
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none',
      }}></div>

      {/* Video Recorder */}
      {showVideoRecorder && quizData && (
        <VideoRecorder 
          onRecordingComplete={(blob) => {
            console.log('Recording completed:', blob);
          }}
        />
      )}

      {/* Main content card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
        padding: '60px 50px 50px 50px',
        minWidth: '400px',
        maxWidth: '500px',
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideUp 0.8s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '40px',
          gap: '16px',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          }}>
            📁
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            margin: '0', 
            color: '#1e293b', 
            fontWeight: '800', 
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Upload Quiz
          </h1>
        </div>

        {/* Drag and drop area */}
        <div
          style={{
            width: '100%',
            minHeight: '180px',
            border: `3px dashed ${isDragOver ? '#667eea' : '#cbd5e1'}`,
            borderRadius: '16px',
            background: isDragOver ? 'rgba(102, 126, 234, 0.05)' : 'rgba(248, 250, 252, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '24px',
            position: 'relative',
            transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: isDragOver ? '1' : '0.7',
            transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s ease',
          }}>
            {isDragOver ? '⬇️' : '📄'}
          </div>
          
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: isDragOver ? '#667eea' : '#475569',
            marginBottom: '8px',
            transition: 'color 0.3s ease',
          }}>
            {isDragOver ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#64748b',
            textAlign: 'center',
          }}>
            or click to browse files
          </div>
        </div>

        {/* Selected file display */}
        {fileName && (
          <div style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            <div style={{ fontSize: '20px' }}>✅</div>
            <div>
              <div style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                File selected
              </div>
              <div style={{ fontSize: '16px', color: '#065f46', fontWeight: '500' }}>
                {fileName}
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {uploadError && (
          <div style={{
            width: '100%',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'shake 0.5s ease-out',
          }}>
            <div style={{ fontSize: '20px' }}>❌</div>
            <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600' }}>
              {uploadError}
            </div>
          </div>
        )}

        {/* Simulate button */}
        {!quizData && (
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            style={{
              fontSize: '18px',
              fontWeight: '700',
              padding: '16px 0',
              width: '100%',
              borderRadius: '12px',
              background: isLoading 
                ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: isLoading 
                ? 'none'
                : '0 8px 24px rgba(102, 126, 234, 0.3), 0 4px 12px rgba(118, 75, 162, 0.2)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease',
              transform: isLoading ? 'scale(0.98)' : 'scale(1)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '15px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4), 0 6px 16px rgba(118, 75, 162, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3), 0 4px 12px rgba(118, 75, 162, 0.2)';
              }
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
                Processing...
              </div>
            ) : (
              '� Process CSV File'
            )}
          </button>
        )}

        {/* Quiz ready section */}
        {quizData && (
          <div style={{ width: '100%', marginBottom: '15px' }}>
            <div style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'fadeIn 0.5s ease-out',
            }}>
              <div style={{ fontSize: '20px' }}>🎯</div>
              <div>
                <div style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                  Quiz Ready!
                </div>
                <div style={{ fontSize: '16px', color: '#065f46', fontWeight: '500' }}>
                  {quizData.length} questions loaded
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/quiz', { state: { quizData } })}
              style={{
                fontSize: '18px',
                fontWeight: '700',
                padding: '16px 0',
                width: '100%',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3), 0 4px 12px rgba(4, 120, 87, 0.2)',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                marginBottom: '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 12px 32px rgba(5, 150, 105, 0.4), 0 6px 16px rgba(4, 120, 87, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 24px rgba(5, 150, 105, 0.3), 0 4px 12px rgba(4, 120, 87, 0.2)';
              }}
            >
              🚀 Start Quiz
            </button>
          </div>
        )}

        {/* Video Recording Toggle - Only show when quiz data is ready */}
        {quizData && (
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setShowVideoRecorder(!showVideoRecorder)}
              style={{
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 0',
                width: '100%',
                borderRadius: '8px',
                background: showVideoRecorder 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                letterSpacing: '0.3px',
                transition: 'all 0.3s ease'
              }}
            >
              {showVideoRecorder ? '🛑 Hide Manual Recorder' : '🎥 Show Manual Recorder (Optional)'}
            </button>
          </div>
        )}
      </div>

      {/* Video Export Section */}
      {quizData && (
        <VideoExporter 
          quizData={quizData}
          onComplete={(blob) => {
            console.log('Video export completed:', blob);
          }}
        />
      )}

      {/* Footer info */}
      <div style={{
        marginTop: '40px',
        padding: '20px 30px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '14px',
        maxWidth: '500px',
        animation: 'fadeIn 1s ease-out 0.5s both',
      }}>
        <div style={{ marginBottom: '8px', fontWeight: '600' }}>
          📋 Accepted format: <strong>CSV</strong>
        </div>
        <div>
          Required columns: question_text, option_1, option_2, option_3, option_4, correct_answer, explanation
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
