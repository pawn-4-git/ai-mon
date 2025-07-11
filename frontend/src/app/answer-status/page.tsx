'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

// Mock data for demonstration
const answerStatuses = [
  {
    id: 1,
    question: '日本の首都はどこでしょう？',
    yourAnswer: '東京',
    status: 'answered',
    statusText: '解答済み',
  },
  {
    id: 2,
    question: '富士山の高さは？',
    yourAnswer: '未解答',
    status: 'unanswered',
    statusText: '未解答',
  },
  {
    id: 3,
    question: '世界で一番長い川は？',
    yourAnswer: 'ナイル川',
    status: 'checked-later',
    statusText: '後で確認',
  },
  {
    id: 4,
    question: '日本の国花は？',
    yourAnswer: '桜',
    status: 'answered',
    statusText: '解答済み',
  },
];

export default function AnswerStatusPage() {
  const router = useRouter();

  return (
    <div className="answer-status-page">
      <Header />

      <div className="container">
        <h2>解答状況一覧 (グループ: 数学)</h2>
        <p>残り時間: <span id="remaining-time">10:00</span></p>
        <ul className="status-list">
          {answerStatuses.map((item) => (
            <li key={item.id} className={`status-item ${item.status}`}>
              <div className="question-info">
                <h3>
                  <Link href="/quiz-play">{`問題${item.id}: ${item.question}`}</Link>
                </h3>
                <p>あなたの回答: {item.yourAnswer}</p>
              </div>
              <span className={`status-badge ${item.status}`}>{item.statusText}</span>
            </li>
          ))}
        </ul>
        <div className="action-buttons">
          <button className="back-button" onClick={() => router.push('/quiz-play')}>
            問題に戻る
          </button>
          <button className="back-button" onClick={() => router.push('/quiz-result')}>
            テストを終える
          </button>
        </div>
      </div>
    </div>
  );
}