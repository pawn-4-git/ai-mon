'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

const currentQuestion = {
  number: 1,
  total: 10,
  text: '日本の首都はどこでしょう？',
  choices: ['東京', '大阪', '京都', '福岡'],
};

export default function QuizPlayPage() {
  const router = useRouter();
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleSelectChoice = (choice) => {
    setSelectedChoice(choice);
    alert('選択しました: ' + choice);
  };

  return (
    <div className="quiz-play-page">
      <Header />

      <div className="container">
        <h2>問題出題中 (グループ: 数学)</h2>
        <div className="question-area">
          <p>
            <strong id="question-number">{`問題${currentQuestion.number}/${currentQuestion.total}`}</strong>
            : {currentQuestion.text}
          </p>
        </div>
        <p>残り時間: <span id="remaining-time">10:00</span></p>
        <ul className="choices-list">
          {currentQuestion.choices.map((choice, index) => (
            <li key={index}>
              <button
                onClick={() => handleSelectChoice(choice)}
                className={selectedChoice === choice ? 'selected' : ''}
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
        <div className="action-buttons">
          <button className="check-later" onClick={() => alert('この問題を後で確認します。')}>
            後で確認する
          </button>
          <button onClick={() => alert('次の問題へ進みます。')}>
            次の問題へ
          </button>
          <button onClick={() => router.push('/answer-status')}>
            解答状況を確認
          </button>
          <button onClick={() => router.push('/quiz-result')}>
            テストを終える
          </button>
        </div>
      </div>
    </div>
  );
}