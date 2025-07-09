'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const quizGroups = [
  {
    id: 1,
    name: '未受験グループA',
    questionCount: 10,
    status: 'not-taken',
    statusText: '未受験',
  },
  {
    id: 2,
    name: '更新ありグループB',
    questionCount: 15,
    status: 'updated',
    statusText: '更新あり',
  },
  {
    id: 3,
    name: '受験済みグループC',
    questionCount: 20,
    status: 'taken',
    statusText: '最終受験: 2024/07/01',
  },
  {
    id: 4,
    name: '受験済みグループD',
    questionCount: 8,
    status: 'taken',
    statusText: '最終受験: 2024/06/25',
  },
];

export default function QuizListPage() {
  const router = useRouter();

  const getStatusClass = (status) => {
    switch (status) {
      case 'not-taken':
        return 'not-taken';
      case 'updated':
        return 'updated';
      default:
        return '';
    }
  };

  const getStatusTextClass = (status) => {
    switch (status) {
        case 'not-taken':
          return 'not-taken-text';
        case 'updated':
          return 'updated-text';
        default:
          return '';
      }
  }

  return (
    <div className="quiz-list-page">
      <div className="header">
        <h1>あいもん</h1>
        <div className="user-info">
          <Link href="/score-history">ようこそ、ユーザー名さん！</Link>
          <Link href="/">ログアウト</Link>
        </div>
      </div>

      <div className="container">
        <h2>問題グループ一覧</h2>
        <ul className="quiz-group-list">
          {quizGroups.map((group) => (
            <li key={group.id} className={`quiz-group-item ${getStatusClass(group.status)}`}>
              <div className="group-info">
                <h3>{group.name}</h3>
                <p>問題数: {group.questionCount}問</p>
              </div>
              <span className={`group-status ${getStatusTextClass(group.status)}`}>{group.statusText}</span>
              <div className="action-buttons">
                <button onClick={() => router.push('/quiz-play')}>テスト開始</button>
                <button className="edit-button" onClick={() => router.push('/create-quiz')}>編集</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="add-button" onClick={() => router.push('/create-quiz')}>
          新しい問題グループを作成
        </button>
      </div>
    </div>
  );
}