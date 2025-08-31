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
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null); // 選択された回答を保持する状態
  const [showAnswer, setShowAnswer] = useState(false); // 正解と解説の表示状態を管理する状態

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
      setSelectedChoice(null); // モーダルが開くたびに選択をリセット
      setShowAnswer(false); // モーダルが開くたびに回答表示をリセット
    }
  }, [isOpen, question]);

  const handleChoiceSelect = (choice: string) => {
    setSelectedChoice(choice);
  };

  const handleSubmit = () => {

  };

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
          <div className="choices-grid">
            {shuffledChoices.map((choice, index) => (
              <button
                key={index}
                className={`choice-button ${selectedChoice === choice ? 'selected' : ''}`}
                onClick={() => handleChoiceSelect(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
        {!showAnswer && (
          <button onClick={() => setShowAnswer(true)} className="view-answer-btn">
            正解と解説を見る
          </button>
        )}
        {showAnswer && (
          <>
            <div className="answer-section">
              <h3>正解</h3>
              <p>{question.CorrectChoice}</p>
            </div>
            <div className="explanation-section">
              <h3>解説</h3>
              <p>{question.Explanation}</p>
            </div>
          </>
        )}
        <button onClick={onClose} className="modal-close-btn">
          閉じる
        </button>
      </div>
    </div>
  );
};

export default SampleQuestionModal;