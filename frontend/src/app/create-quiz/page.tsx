'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function CreateQuizPage() {
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showQuizList, setShowQuizList] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    choice1: '',
    choice2: '',
    choice3: '',
    choice4: '',
    correctAnswer: '',
    explanation: '',
    category: '',
    autoTopic: '',
    autoCount: 10
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateDummyChoices = () => {
    setFormData({
      ...formData,
      choice1: 'ダミー選択肢1',
      choice2: 'ダミー選択肢2',
      choice3: 'ダミー選択肢3',
      choice4: 'ダミー選択肢4'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('クイズが保存されました！');
    router.push('/quiz-list');
  };

  const handleAutoGenerate = () => {
    alert(`「${formData.autoTopic}」に関する${formData.autoCount}問のクイズを自動生成します。`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">クイズ作成</h1>

        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => setIsAutoMode(false)}
            className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
              !isAutoMode 
                ? 'border-blue-600 text-blue-600 font-medium' 
                : 'border-gray-300 text-gray-500'
            }`}
          >
            手動作成
          </button>
          <button
            type="button"
            onClick={() => setIsAutoMode(true)}
            className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
              isAutoMode 
                ? 'border-blue-600 text-blue-600 font-medium' 
                : 'border-gray-300 text-gray-500'
            }`}
          >
            自動生成
          </button>
        </div>

        {!isAutoMode ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card title="問題設定">
              <div className="form-group">
                <label htmlFor="question">問題文:</label>
                <textarea
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  placeholder="問題文を入力してください"
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">カテゴリ:</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">カテゴリを選択</option>
                  <option value="math">数学</option>
                  <option value="history">歴史</option>
                  <option value="science">科学</option>
                  <option value="language">言語</option>
                </select>
              </div>
            </Card>

            <Card title="選択肢">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">選択肢を入力:</h3>
                <Button type="button" onClick={generateDummyChoices} variant="secondary">
                  ダミー選択肢生成
                </Button>
              </div>

              <div className="space-y-3">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="form-group">
                    <label htmlFor={`choice${num}`}>選択肢{num}:</label>
                    <input
                      type="text"
                      id={`choice${num}`}
                      name={`choice${num}`}
                      value={formData[`choice${num}` as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={`選択肢${num}を入力`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="correctAnswer">正解:</label>
                <select
                  id="correctAnswer"
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">正解を選択</option>
                  <option value="1">選択肢1</option>
                  <option value="2">選択肢2</option>
                  <option value="3">選択肢3</option>
                  <option value="4">選択肢4</option>
                </select>
              </div>
            </Card>

            <Card title="解説・参考資料">
              <div className="form-group">
                <label htmlFor="explanation">解説:</label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  placeholder="解説を入力してください"
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">商品リンク:</h4>
                <div className="space-y-2 text-sm">
                  <a href="https://www.amazon.co.jp" className="text-blue-600 hover:underline block">
                    Amazon - 関連書籍を検索
                  </a>
                  <a href="https://books.rakuten.co.jp" className="text-blue-600 hover:underline block">
                    楽天ブックス - 参考書を探す
                  </a>
                </div>
              </div>
            </Card>

            <div className="flex space-x-4">
              <Button type="submit" variant="primary">
                クイズを保存
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowQuizList(true)} 
                variant="secondary"
              >
                クイズ一覧を表示
              </Button>
              <Button 
                type="button" 
                onClick={() => router.push('/quiz-group')} 
                variant="warning"
              >
                グループ設定
              </Button>
            </div>
          </form>
        ) : (
          <Card title="自動生成">
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="autoTopic">トピック:</label>
                <input
                  type="text"
                  id="autoTopic"
                  name="autoTopic"
                  value={formData.autoTopic}
                  onChange={handleInputChange}
                  placeholder="例: 日本の歴史、基本的な数学"
                />
              </div>

              <div className="form-group">
                <label htmlFor="autoCount">問題数:</label>
                <input
                  type="number"
                  id="autoCount"
                  name="autoCount"
                  value={formData.autoCount}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                />
              </div>

              <Button onClick={handleAutoGenerate} variant="primary">
                自動生成開始
              </Button>
            </div>
          </Card>
        )}

        {showQuizList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">作成済みクイズ一覧</h3>
                <button
                  onClick={() => setShowQuizList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <div className="p-3 border rounded">数学基礎 - 10問</div>
                <div className="p-3 border rounded">歴史問題 - 15問</div>
                <div className="p-3 border rounded">科学知識 - 12問</div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
