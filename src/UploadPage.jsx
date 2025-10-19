import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

export default function UploadPage() {
  const [promotionLink, setPromotionLink] = useState('');
  const [quizTitle, setQuizTitle] = useState('AWS Mastery Quiz');
  const [footerText, setFooterText] = useState('Powered by AWS Learning Hub');
  const [socialProofText, setSocialProofText] = useState('Join 50,000+ AWS professionals');
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    // Auto-process the selected file
    handleProcessCSV();
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
      // Create a new DataTransfer object to properly set the files
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      setFileName(file.name);
      setUploadError('');
      // Auto-process the dropped file
      handleProcessCSV();
    } else {
      setUploadError('Please drop a valid CSV file.');
    }
  };

  const handleProcessCSV = () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setUploadError('Please select a CSV file.');
      return;
    }
    
    console.log('Processing CSV file:', file.name, 'Size:', file.size);
    setIsLoading(true);
    setUploadError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        console.log('File read successfully, parsing with Papa Parse...');
        Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const { data, errors } = results;
              console.log('Papa Parse results:', { data, errors });
              
              if (errors.length > 0) {
                console.error('Parse errors:', errors);
                setUploadError('Error parsing CSV file: ' + errors[0].message);
                setIsLoading(false);
                return;
              }
              
              if (!data || data.length === 0) {
                setUploadError('CSV file is empty or invalid.');
                setIsLoading(false);
                return;
              }
              
              console.log('First row of data:', data[0]);
              console.log('Available columns:', Object.keys(data[0]));
              
              // Validate required columns (more flexible)
              const requiredColumns = ['question_text', 'option_1', 'option_2', 'correct_answer'];
              const firstRow = data[0];
              const availableColumns = Object.keys(firstRow);
              const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
              
              if (missingColumns.length > 0) {
                console.error('Missing columns:', missingColumns);
                setUploadError(`Missing required columns: ${missingColumns.join(', ')}. Available columns: ${availableColumns.join(', ')}`);
                setIsLoading(false);
                return;
              }
              
              // Transform CSV data to quiz format
              const quizData = data.map((row, index) => {
                console.log(`Processing row ${index + 1}:`, row);
                
                const options = [
                  row.option_1?.trim(),
                  row.option_2?.trim(),
                  row.option_3?.trim(),
                  row.option_4?.trim()
                ].filter(option => option && option.length > 0);
                
                console.log(`Row ${index + 1} options:`, options);
                
                if (options.length < 2) {
                  throw new Error(`Row ${index + 1}: At least 2 options are required. Found: ${options.length}`);
                }
                
                // Handle correct_answer as option number (1, 2, 3, 4) or direct text
                let correctAnswer = null;
                const correctAnswerValue = row.correct_answer?.trim();
                
                // Try as option number first
                const correctAnswerIndex = parseInt(correctAnswerValue) - 1;
                if (correctAnswerIndex >= 0 && correctAnswerIndex < options.length) {
                  correctAnswer = options[correctAnswerIndex];
                } else {
                  // Try as direct text match
                  correctAnswer = options.find(option => 
                    option.toLowerCase() === correctAnswerValue.toLowerCase()
                  ) || correctAnswerValue;
                }
                
                console.log(`Row ${index + 1} correct answer:`, correctAnswer);
                
                return {
                  question: row.question_text?.trim() || `Question ${index + 1}`,
                  options: options,
                  answer: correctAnswer,
                  explanation: row.explanation?.trim() || null,
                  topic_id: row.topic_id || null,
                  question_id: row.question_id || index + 1
                };
              });
              
              console.log('Processed quiz data:', quizData);
              
              if (quizData.length === 0) {
                setUploadError('No valid questions found in CSV file.');
                setIsLoading(false);
                return;
              }
              
              // Store quiz data
              setQuizData(quizData);
              setIsLoading(false);
              console.log('CSV processing completed successfully. Questions loaded:', quizData.length);
              
            } catch (err) {
              console.error('Error processing CSV data:', err);
              setUploadError('Error processing CSV data: ' + err.message);
              setIsLoading(false);
            }
          },
          error: (error) => {
            console.error('Papa Parse error:', error);
            setUploadError('Could not parse CSV file: ' + error.message);
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('FileReader error:', err);
        setUploadError('Could not read CSV file. Please check your file format.');
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleStartQuiz = () => {
    // Store the customization in localStorage
    localStorage.setItem('quizCustomization', JSON.stringify({
      promotionLink,
      quizTitle,
      footerText,
      socialProofText
    }));
    
    // Navigate to quiz with customization and quiz data (if any)
    navigate('/quiz', { 
      state: { 
        quizData: quizData,
        customization: {
          promotionLink,
          quizTitle,
          footerText,
          socialProofText
        }
      } 
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'auto',
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none',
      }}></div>

      {/* Main Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 32px 64px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 32px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(255,255,255,0.05)" fill-rule="evenodd"%3E%3Cpath d="M20 20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20z"/%3E%3C/g%3E%3C/svg%3E")',
            pointerEvents: 'none',
          }}></div>
          
          <div style={{
            width: '60px',
            height: '60px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}>
            ⚡
          </div>
          
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          }}>
            Quiz Builder
          </h1>
          
          <p style={{
            fontSize: '14px',
            margin: '0',
            opacity: '0.9',
            fontWeight: '400',
          }}>
            Create professional quizzes in seconds
          </p>
        </div>

        {/* Content Section */}
        <div style={{ 
          padding: '32px',
          flex: 1,
          overflow: 'auto',
          maxHeight: 'calc(90vh - 140px)',
        }}>
          
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowCustomOptions(false)}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: !showCustomOptions ? '#ffffff' : 'transparent',
                color: !showCustomOptions ? '#1e293b' : '#64748b',
                boxShadow: !showCustomOptions ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                transform: !showCustomOptions ? 'translateY(-1px)' : 'none',
              }}
            >
              🚀 Quick Start
            </button>
            <button
              onClick={() => setShowCustomOptions(true)}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: showCustomOptions ? '#ffffff' : 'transparent',
                color: showCustomOptions ? '#1e293b' : '#64748b',
                boxShadow: showCustomOptions ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                transform: showCustomOptions ? 'translateY(-1px)' : 'none',
              }}
            >
              📊 Custom CSV
            </button>
          </div>

          {/* CSV Upload Section */}
          {showCustomOptions && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 16px 0',
              }}>
                Upload Custom Questions
              </h3>
              
              {/* Drag and Drop Area */}
              <div
                style={{
                  border: `2px dashed ${isDragOver ? '#667eea' : '#cbd5e1'}`,
                  borderRadius: '16px',
                  background: isDragOver ? 'rgba(102, 126, 234, 0.05)' : '#f8fafc',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                  position: 'relative',
                  overflow: 'hidden',
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
                  transition: 'all 0.3s ease',
                  transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
                }}>
                  {isDragOver ? '⬇️' : '📁'}
                </div>
                
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: isDragOver ? '#667eea' : '#1e293b',
                  margin: '0 0 8px 0',
                  transition: 'color 0.3s ease',
                }}>
                  {isDragOver ? 'Drop your CSV file here' : 'Choose CSV file or drag & drop'}
                </h4>
                
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0',
                  lineHeight: '1.5',
                }}>
                  Supports CSV files with questions and multiple choice options
                </p>
              </div>

              {/* File Status */}
              {fileName && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                      {fileName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669' }}>
                      File selected and ready to process
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {uploadError && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                    {uploadError}
                  </div>
                </div>
              )}

              {/* Process Button */}
              {fileName && !quizData && (
                <button
                  onClick={handleProcessCSV}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    background: isLoading 
                      ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: isLoading ? '#64748b' : '#ffffff',
                    boxShadow: isLoading ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(100, 116, 139, 0.3)',
                        borderTop: '2px solid #64748b',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}></div>
                      Processing CSV...
                    </div>
                  ) : (
                    '⚡ Process CSV File'
                  )}
                </button>
              )}
            </div>
          )}

          {/* CSV Success Banner */}
          {quizData && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              border: '2px solid #10b981',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#065f46',
                margin: '0 0 4px 0',
              }}>
                CSV Processed Successfully!
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#059669',
                margin: '0',
              }}>
                {quizData.length} custom questions loaded and ready
              </p>
            </div>
          )}
          
          {/* Branding Configuration */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0',
            }}>
              Customize Your Brand
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Promotion Link */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  🔗 Promotion Link
                </label>
                <input
                  type="url"
                  value={promotionLink}
                  onChange={(e) => setPromotionLink(e.target.value)}
                  placeholder="https://your-website.com"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  margin: '4px 0 0 0',
                }}>
                  Optional: Add your website or course link for QR code generation
                </p>
              </div>

              {/* Quiz Title */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  📝 Quiz Title
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter your quiz title"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Footer Message */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  💬 Footer Message
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Enter footer message"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Social Proof Text */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  🌟 Social Proof Message
                </label>
                <input
                  type="text"
                  value={socialProofText}
                  onChange={(e) => setSocialProofText(e.target.value)}
                  placeholder="Join 50,000+ AWS professionals"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  margin: '4px 0 0 0',
                }}>
                  Text that appears with the star rating (e.g., "Join 50,000+ AWS professionals")
                </p>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleStartQuiz}
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              letterSpacing: '0.5px',
              textTransform: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
            }}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>
              🚀 Launch Quiz {quizData ? `(${quizData.length} Questions)` : ''}
            </span>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.5s ease',
            }}></div>
          </button>

          {/* Preview Card */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}>
            <h4 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              👁️ Live Preview
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Title:</strong> {quizTitle}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Footer:</strong> {footerText}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Social Proof:</strong> {socialProofText}
              </div>
              {promotionLink && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#374151' }}>QR Link:</strong> {promotionLink}
                </div>
              )}
              <div>
                <strong style={{ color: '#374151' }}>Questions:</strong> {quizData ? `${quizData.length} custom questions` : 'Built-in AWS questions'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        button:hover .shimmer {
          left: 100%;
        }
      `}</style>
    </div>
  );
}