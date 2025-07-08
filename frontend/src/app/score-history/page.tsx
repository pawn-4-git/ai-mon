'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ScoreRecord } from '@/types';

const mockScoreRecords: ScoreRecord[] = [
  {
    id: '1',
    groupName: '数学基礎',
    score: 85,
    totalQuestions: 10,
    date: new Date('2024-01-15'),
    timeSpent: 12
  },
  {
    id: '2',
    groupName: '歴史問題',
    score: 92,
    totalQuestions: 15,
    date: new Date('2024-01-10'),
    timeSpent: 18
  },
  {
    id: '3',
    groupName: '科学知識',
    score: 78,
    totalQuestions: 12,
    date: new Date('2024-01-05'),
    timeSpent: 15
  }
];

export default function ScoreHistoryPage() {
  const [scoreRecords] = useState<ScoreRecord[]>(mockScoreRecords);
  const router = useRouter();

  const averageScore = Math.round(
    scoreRecords.reduce((sum, record) => sum + record.score, 0) / scoreRecords.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleDeleteRecord = (recordId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _recordId = recordId;
    if (confirm('この記録を削除しますか？')) {
      alert('記録を削除しました。');
    }
  };

  const handleBackToList = () => {
    router.push('/quiz-list');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">成績分析</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card title="グループ別成績">
            <div className="space-y-3">
              {scoreRecords.map((record) => (
                <div key={record.id} className="flex justify-between items-center p-2 border-b">
                  <span className="font-medium">{record.groupName}</span>
                  <span className={`font-bold ${getScoreColor(record.score)}`}>
                    {record.score}点
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="スコア推移">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{averageScore}</div>
              <div className="text-gray-600 mb-4">平均スコア</div>
              <div className="bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${averageScore}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                グラフ表示機能は今後実装予定
              </div>
            </div>
          </Card>
        </div>

        <Card title="個別記録" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">日付</th>
                  <th className="text-left p-2">グループ</th>
                  <th className="text-left p-2">スコア</th>
                  <th className="text-left p-2">問題数</th>
                  <th className="text-left p-2">所要時間</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {scoreRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{record.date.toLocaleDateString('ja-JP')}</td>
                    <td className="p-2">{record.groupName}</td>
                    <td className={`p-2 font-bold ${getScoreColor(record.score)}`}>
                      {record.score}点
                    </td>
                    <td className="p-2">{record.totalQuestions}問</td>
                    <td className="p-2">{record.timeSpent}分</td>
                    <td className="p-2">
                      <Button
                        onClick={() => handleDeleteRecord(record.id)}
                        variant="danger"
                        size="sm"
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="弱点分析">
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800 mb-2">改善が必要な分野</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 数学の計算問題: 正答率 60%</li>
                <li>• 歴史の年代問題: 正答率 55%</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <h4 className="font-semibold text-green-800 mb-2">得意分野</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 科学の基礎知識: 正答率 95%</li>
                <li>• 地理問題: 正答率 90%</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button onClick={handleBackToList} variant="secondary">
            クイズ一覧に戻る
          </Button>
          <Button onClick={() => alert('記録をエクスポートします')} variant="primary">
            記録をエクスポート
          </Button>
        </div>
      </div>
    </div>
  );
}
