import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage';
import QuizPage from './QuizPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </BrowserRouter>
  );
}
