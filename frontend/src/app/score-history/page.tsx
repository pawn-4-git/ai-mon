'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const scoreRecords = [
  { id: 1, text: '2024/06/01 - 数学テスト (正答率: 85%)' },
  { id: 2, text: '2024/05/20 - 歴史クイズ (正答率: 70%)' },
  { id: 3, text: '2024/05/15 - 科学演習 (正答率: 92%)' },
  { id: 4, text: '2024/05/01 - 数学テスト (正答率: 78%)' },
];

export default function ScoreHistoryPage() {
  const router = useRouter();

  return (
    <div className="score-history-page">
      <div className="header">
        <h1>あいもん</h1>
        <div className="user-info">
          ようこそ、ユーザー名さん！
          <Link href="/">ログアウト</Link>
        </div>
      </div>

      <div className="container">
        <h2>成績確認</h2>

        <div className="section">
          <h3>グループ別分析</h3>
          <p><strong>数学:</strong> 平均正答率 75% / 最高得点 90点</p>
          <p><strong>歴史:</strong> 平均正答率 60% / 最高得点 85点</p>
          <p><strong>科学:</strong> 平均正答率 80% / 最高得点 95点</p>
        </div>

        <div className="section">
          <h3>得点推移グラフ (直近10回)</h3>
          <p><strong>数学グループ:</strong></p>
          <div className="graph-placeholder">グラフ表示エリア（データ未実装）</div>
          <p><strong>歴史グループ:</strong></p>
          <div className="graph-placeholder">グラフ表示エリア（データ未実装）</div>
        </div>

        <div className="section">
          <h3>個別の成績記録</h3>
          {scoreRecords.map((record) => (
            <div key={record.id} className="score-record">
              <span>{record.text}</span>
              <button onClick={() => alert('この記録を削除します。（機能は未実装）')}>削除</button>
            </div>
          ))}
        </div>

        <div className="section">
          <h3>苦手傾向分析</h3>
          <p><strong>数学:</strong> 「微分積分」に関する問題で間違いが多い傾向があります。</p>
          <p><strong>歴史:</strong> 「江戸時代」の文化史に関する問題で理解が不足しているようです。</p>
          <p><strong>全体:</strong> 長文読解を必要とする問題で正答率が低い傾向が見られます。</p>
        </div>

        <div className="action-buttons">
          <button onClick={() => alert('すべての成績記録を削除します。（機能は未実装）')}>
            すべての成績記録を削除
          </button>
          <button onClick={() => router.push('/quiz-list')}>
            問題一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}