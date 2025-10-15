# Quiz Builder - User Manual

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Quick Start Mode](#quick-start-mode)
3. [Custom CSV Mode](#custom-csv-mode)
4. [Quiz Customization](#quiz-customization)
5. [Running the Quiz](#running-the-quiz)
6. [CSV File Format](#csv-file-format)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

The Quiz Builder is a professional web application that allows you to create and run interactive quizzes with:
- **Built-in AWS questions** for immediate use
- **Custom question upload** via CSV files
- **Brand customization** with your logo, links, and messaging
- **QR code generation** for promotion links
- **Professional UI** perfect for presentations and recordings

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No software installation required
- Works on desktop, tablet, and mobile devices

---

## ⚡ Quick Start Mode

Perfect for immediate use with pre-loaded AWS certification questions.

### Steps:
1. **Open the application** in your web browser
2. **Keep "Quick Start" tab selected** (default)
3. **Customize your branding** (optional):
   - Add your website URL for QR code
   - Change quiz title
   - Update footer message
4. **Click "Launch Quiz"** to start immediately

### Features:
- 10 pre-loaded AWS questions
- Professional quiz interface
- Automatic timing and scoring
- Ready for screen recording

---

## 📊 Custom CSV Mode

Upload your own questions for personalized quizzes.

### Steps:
1. **Click "Custom CSV" tab**
2. **Upload your CSV file** using either method:
   - **Drag & Drop**: Drag your CSV file into the upload area
   - **File Browser**: Click the upload area to browse and select your file
3. **File processes automatically** - you'll see a green success banner
4. **Customize your branding** (optional)
5. **Click "Launch Quiz"** with your custom questions

### Supported File Types:
- `.csv` files only
- UTF-8 encoding recommended
- Maximum file size: 10MB

---

## 🎨 Quiz Customization

### Promotion Link 🔗
- **Purpose**: Your website or course link
- **Feature**: Automatically generates QR code
- **Usage**: Students can scan QR code to visit your site
- **Format**: Full URL (e.g., `https://your-website.com`)

### Quiz Title 📝
- **Default**: "AWS Mastery Quiz"
- **Customization**: Change to match your course/brand
- **Examples**: 
  - "Cloud Computing Fundamentals"
  - "DevOps Certification Prep"
  - "Your Company Training Quiz"

### Footer Message 💬
- **Default**: "Powered by AWS Learning Hub"
- **Customization**: Add your branding/credits
- **Examples**:
  - "Created by [Your Name]"
  - "© 2025 Your Training Company"
  - "Visit our website for more courses"

---

## 🎯 Running the Quiz

### Quiz Interface Features:
- **Timer**: 25 seconds per question
- **Progress Bar**: Shows current question number
- **QR Code**: Displays your promotion link (if provided)
- **Animated Options**: Smooth reveal and selection effects
- **Explanations**: Detailed answers after each question
- **Final Score**: Complete results at the end

### Quiz Flow:
1. **Question Display** (3 seconds)
2. **Options Appear** (animated reveal)
3. **Answer Selection** (participant clicks)
4. **Correct Answer Highlight** (3 seconds)
5. **Explanation Display** (5 seconds)
6. **Next Question** (automatic progression)

### Controls:
- **Click any option** to select your answer
- **Automatic progression** - no manual navigation needed
- **Professional animations** perfect for recording
- **Responsive design** works on all screen sizes

---

## 📄 CSV File Format

### Required Columns:
| Column Name | Description | Example |
|-------------|-------------|---------|
| `question_text` | The question to ask | "What does AWS stand for?" |
| `option_1` | First answer choice | "Amazon Web Services" |
| `option_2` | Second answer choice | "Amazon World Services" |
| `correct_answer` | Correct answer (number or text) | "1" or "Amazon Web Services" |

### Optional Columns:
| Column Name | Description | Example |
|-------------|-------------|---------|
| `option_3` | Third answer choice | "Amazon Web Systems" |
| `option_4` | Fourth answer choice | "Amazon World Systems" |
| `explanation` | Detailed explanation | "AWS stands for Amazon Web Services..." |

### Sample CSV Template:
```csv
question_text,option_1,option_2,option_3,option_4,correct_answer,explanation
What does AWS stand for?,Amazon Web Services,Amazon World Services,Amazon Web Systems,Amazon World Systems,1,AWS stands for Amazon Web Services - Amazon's cloud computing platform
Which service provides object storage?,Amazon EBS,Amazon S3,Amazon RDS,Amazon EC2,2,Amazon S3 (Simple Storage Service) is AWS's primary object storage service
What is the default VPC limit per region?,5,10,15,20,1,AWS allows 5 VPCs per region by default but this can be increased
```

### CSV Tips:
- **Save as CSV**: Use Excel "Save As" → "CSV (Comma delimited)"
- **UTF-8 Encoding**: Ensures special characters display correctly
- **No Empty Rows**: Remove blank lines between questions
- **Consistent Formatting**: Keep column names exactly as shown above

### Answer Format Options:
- **Option Numbers**: Use "1", "2", "3", or "4"
- **Full Text**: Use complete answer text "Amazon Web Services"
- **Case Insensitive**: "amazon web services" will match "Amazon Web Services"

---

## 🔧 Troubleshooting

### Common Issues & Solutions:

#### "Missing required columns" Error
**Problem**: CSV file doesn't have the right column names
**Solution**: 
- Check column names match exactly: `question_text`, `option_1`, `option_2`, `correct_answer`
- Remove any extra spaces in column headers
- Ensure first row contains column names, not data

#### Questions Not Loading
**Problem**: CSV processed but using default questions
**Solution**:
- Check browser console (F12) for detailed error messages
- Verify at least 2 options per question
- Ensure correct_answer values match your options
- Try with a smaller test file first

#### Broken Characters/Symbols
**Problem**: Special characters showing as question marks
**Solution**:
- Save CSV with UTF-8 encoding
- Avoid special characters in CSV if possible
- Use plain text editor to check file encoding

#### QR Code Not Showing Custom Link
**Problem**: QR code shows default AWS link instead of your link
**Solution**:
- Ensure Promotion Link starts with "http://" or "https://"
- Check for typos in the URL
- Verify link is accessible/valid

#### File Upload Not Working
**Problem**: Can't upload or drag files
**Solution**:
- Try refreshing the page
- Ensure file is .csv format
- Check file size (should be under 10MB)
- Try different browser if issues persist

### Browser Console Debugging:
1. Press **F12** to open browser tools
2. Click **Console** tab
3. Upload your CSV file
4. Look for detailed error messages
5. Check what data was processed

---

## 📞 Support Information

### Getting Help:
- Check console logs for detailed error messages
- Verify CSV format matches the template exactly
- Test with the provided sample CSV first
- Ensure all required columns are present

### Best Practices:
- **Test First**: Always test with a small CSV file before full upload
- **Backup**: Keep original files as backup
- **Simple Format**: Use basic text without special formatting
- **Browser**: Use latest version of Chrome/Firefox for best experience

### Performance Tips:
- **Optimal Size**: 10-50 questions work best for presentations
- **File Size**: Keep CSV under 1MB for faster processing
- **Browser**: Close unnecessary tabs for better performance

---

## 🎥 Perfect for Content Creation

This Quiz Builder is designed specifically for:
- **YouTube recordings**
- **Course content**
- **Live presentations**
- **Training sessions**
- **Educational videos**

### Recording Tips:
- **Full Screen**: Use F11 for distraction-free recording
- **Professional Look**: All animations and timing optimized for video
- **Branding**: Customize all text to match your brand
- **QR Integration**: Perfect for driving traffic to your content

---

*Quiz Builder v1.0 - Professional Quiz Creation Made Simple*
