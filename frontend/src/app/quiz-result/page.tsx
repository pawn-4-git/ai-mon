'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const quizResults = [
  {
    id: 1,
    question: '日本の首都はどこでしょう？',
    yourAnswer: '東京',
    correctAnswer: '東京',
    isCorrect: true,
    explanation: '東京は日本の政治、経済、文化の中心地です。',
  },
  {
    id: 2,
    question: '富士山の高さは？',
    yourAnswer: '3000m',
    correctAnswer: '3776m',
    isCorrect: false,
    explanation: '富士山は標高3776メートルで、日本で最も高い山です。',
  },
  {
    id: 3,
    question: '世界で一番長い川は？',
    yourAnswer: 'ナイル川',
    correctAnswer: 'ナイル川',
    isCorrect: true,
    explanation: 'ナイル川はアフリカ大陸を流れ、世界で最も長い川として知られています。',
  },
];

const allReferenceBooks = [
    { imgSrc: "https://via.placeholder.com/150x200?text=Math+Book+1", title: "数学の基礎 - 完全攻略", link: "https://example.com/math-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=History+Book+1", title: "日本史重要ポイント解説", link: "https://example.com/history-guide-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Science+Book+1", title: "科学の不思議 - 図解百科", link: "https://example.com/science-encyclopedia-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=English+Book+1", title: "英語文法マスター", link: "https://example.com/english-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Physics+Book+1", title: "物理学入門", link: "https://example.com/physics-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Chemistry+Book+1", title: "化学の基本", link: "https://example.com/chemistry-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Geography+Book+1", title: "世界地理の旅", link: "https://example.com/geography-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Art+Book+1", title: "美術史概論", link: "https://example.com/art-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Economics+Book+1", title: "経済学のABC", link: "https://example.com/economics-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Programming+Book+1", title: "プログラミング基礎", link: "https://example.com/programming-book-1" }
];

const getRandomBooks = (arr, num) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
};


export default function QuizResultPage() {
  const router = useRouter();
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  useEffect(() => {
    setRecommendedBooks(getRandomBooks(allReferenceBooks, 3));
  }, []);

  const correctCount = quizResults.filter(r => r.isCorrect).length;
  const totalCount = quizResults.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="quiz-result-page">
      <div className="header">
        <h1>あいもん</h1>
        <div className="user-info">
          <Link href="/score-history">ようこそ、ユーザー名さん！</Link>
          <Link href="/">ログアウト</Link>
        </div>
      </div>

      <div className="container">
        <h2>テスト結果</h2>
        <div className="result-summary">
          <p>{`あなたの正解率: ${percentage}% (${correctCount}/${totalCount}問)`}</p>
        </div>

        <ul className="quiz-results-list">
          {quizResults.map((result) => (
            <li key={result.id} className={`quiz-result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
              <h3>{`問題${result.id}: ${result.question}`}</h3>
              <p>あなたの回答: {result.yourAnswer}</p>
              <p>正解: {result.correctAnswer}</p>
              <p className={`answer-status ${result.isCorrect ? 'correct-text' : 'incorrect-text'}`}>
                {result.isCorrect ? '正解！' : '不正解...'}
              </p>
              <div className="explanation">
                <p>解説: {result.explanation}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="reference-links">
            <h3>参考書・関連リソース</h3>
            <ul id="reference-books-list">
                {recommendedBooks.map((book, index) => (
                    <li key={index}>
                        <a href={book.link} target="_blank" rel="noopener noreferrer">
                            <img src={book.imgSrc} alt={book.title} />
                            {book.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push('/score-history')}>成績を記録する</button>
          <button className="secondary" onClick={() => router.push('/quiz-list')}>
            問題一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}