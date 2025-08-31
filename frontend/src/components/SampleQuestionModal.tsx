// frontend/src/components/SampleQuestionModal.tsx
import React from 'react';
import { Question } from '../types';

interface SampleQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
}

const SampleQuestionModal: React.FC<SampleQuestionModalProps> = ({ isOpen, onClose, question }) => {
  if (!isOpen || !question) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>サンプル問題</h2>
        <div className="question-section">
          <h3>問題</h3>
          <p>{question.text}</p>
        </div>
        <div className="choices-section">
          <h3>選択肢</h3>
          <ul>
            {question.choices.map((choice, index) => (
              <li key={index}>{choice}</li>
            ))}
          </ul>
        </div>
        <div className="answer-section">
          <h3>正解</h3>
          <p>{question.choices[question.correctAnswer]}</p>
        </div>
        <div className="explanation-section">
          <h3>解説</h3>
          <p>{question.explanation}</p>
        </div>
        <button onClick={onClose} className="modal-close-btn">
          閉じる
        </button>
      </div>
    </div >
  );
};

export default SampleQuestionModal;
