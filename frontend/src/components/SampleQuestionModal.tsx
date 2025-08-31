'use client';

import React, { useState, useEffect } from 'react';
import { SampleQuestion } from '../types';

interface SampleQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: SampleQuestion | null;
}

const SampleQuestionModal: React.FC<SampleQuestionModalProps> = ({ isOpen, onClose, question }) => {
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && question) {
      const correctAnswerText = question.CorrectChoice;
      const incorrectChoices = question.IncorrectChoices || [];

      // 不正解の選択肢からランダムに3つ取得 (重複なし)
      const shuffledIncorrect = incorrectChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      // 正解と不正解を合わせてシャッフル
      const allChoices = [correctAnswerText, ...shuffledIncorrect];
      const finalShuffledChoices = allChoices.sort(() => 0.5 - Math.random());

      setShuffledChoices(finalShuffledChoices);
    }
  }, [isOpen, question]);

  if (!isOpen || !question) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>サンプル問題</h2>
        <div className="question-section">
          <h3>問題</h3>
          <p>{question.QuestionText}</p>
        </div>
        <div className="choices-section">
          <h3>選択肢</h3>
          <ul>
            {shuffledChoices.map((choice, index) => (
              <li key={index}>{choice}</li>
            ))}
          </ul>
        </div>
        <div className="answer-section">
          <h3>正解</h3>
          <p>{question.CorrectChoice}</p>
        </div>
        <div className="explanation-section">
          <h3>解説</h3>
          <p>{question.Explanation}</p>
        </div>
        <button onClick={onClose} className="modal-close-btn">
          閉じる
        </button>
      </div>
    </div>
  );
};

export default SampleQuestionModal;