'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

// クイズグループの型を拡張
interface QuizGroup {
  id: string;
  name: string;
  questionCount: number;
  timeLimitMinutes: number;
}

// APIから返される個々のクイズグループの型
interface ApiQuizGroup {
  GroupId: string;
  Name: string;
  QuestionCount: number;
  TimeLimitMinutes: number;
}

// APIレスポンス全体の型
interface QuizGroupsApiResponse {
  groups: ApiQuizGroup[];
}

export default function QuizGroupPage() {
  const router = useRouter();
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([]);
  const [selectedQuizGroup, setSelectedQuizGroup] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  // APIからクイズグループを取得
  useEffect(() => {
    const fetchQuizGroups = async () => {
      if (!window.apiClient) {
        alert('APIクライアントの準備ができていません。');
        return;
      }
      try {
        // APIからクイズグループのリストを取得
        const response = (await window.apiClient.get(
          '/Prod/quiz-groups',
        )) as QuizGroupsApiResponse;
        if (response && response.groups) {
          // APIのレスポンスをフロントエンドの型にマッピング
          const fetchedGroups: QuizGroup[] = response.groups.map(group => ({
            id: group.GroupId,
            name: group.Name,
            questionCount: group.QuestionCount,
            timeLimitMinutes: group.TimeLimitMinutes,
          }));
          setQuizGroups(fetchedGroups);
        }
      } catch (error) {
        console.error('Failed to fetch quiz groups:', error);
        alert('問題グループの取得に失敗しました。');
      }
    };

    fetchQuizGroups();
  }, []);

  // グループ選択が変更されたときの処理
  const handleGroupSelectionChange = (groupId: string) => {
    setSelectedQuizGroup(groupId);
    if (groupId && groupId !== 'new') {
      const selectedGroup = quizGroups.find(g => g.id === groupId);
      if (selectedGroup) {
        setQuestionCount(selectedGroup.questionCount);
        setTimeLimitMinutes(selectedGroup.timeLimitMinutes);
      }
    } else {
      // 新規作成または未選択の場合はデフォルト値にリセット
      setNewGroupName('');
      setQuestionCount(10);
      setTimeLimitMinutes(15);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('新しいグループ名を入力してください。');
      return;
    }
    if (!window.apiClient) {
      alert('APIクライアントの準備ができていませ��。');
      return;
    }

    try {
      const body = {
        name: newGroupName,
        questionCount,
        timeLimitMinutes,
      };
      // レスポンスを受け取るように変更
      const response = await window.apiClient.post('/Prod/quiz-groups', body) as { GroupId: string };

      if (response && response.GroupId) {
        alert('新しい問題グループが作成されました！');
        // create-quiz に GroupId と Name を渡して遷移
        router.push(`/create-quiz?id=${response.GroupId}&name=${encodeURIComponent(newGroupName)}`);
      } else {
        throw new Error("GroupId was not returned from the API.");
      }
    } catch (error) {
      console.error('Failed to create quiz group:', error);
      alert('問題グループの作成に失敗しました。');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedQuizGroup || selectedQuizGroup === 'new') {
      alert('更新対象のグループが選択されていません。');
      return;
    }
    if (!window.apiClient) {
      alert('APIクライアントの準備ができていません。');
      return;
    }

    const selectedGroup = quizGroups.find(g => g.id === selectedQuizGroup);
    if (!selectedGroup) {
      alert('選択されたグループ情報が見つかりません。');
      return;
    }

    try {
      const body = {
        questionCount,
        timeLimitMinutes,
      };
      await window.apiClient.put(`/Prod/quiz-groups/${selectedQuizGroup}`, body);
      alert('問題グループの設定を更新しました！');
      router.push(`/create-quiz?id=${selectedQuizGroup}&name=${encodeURIComponent(selectedGroup.name)}`);
    } catch (error) {
      console.error('Failed to update quiz group:', error);
      alert('問題グループの更新に失敗しました。');
    }
  };

  const handleBack = () => {
    router.push('/create-quiz');
  };

  const renderButton = () => {
    if (selectedQuizGroup === 'new') {
      return <button onClick={handleCreateGroup}>作成</button>;
    }
    if (selectedQuizGroup) {
      return <button onClick={handleUpdateGroup}>保存</button>;
    }
    return null; // 何も選択されていない場合はボタンを表示しない
  };

  return (
    <div className="quiz-group-page">
      <Header />
      <div className="container">
        <h2>問題グループ設定</h2>
        <div className="form-group">
          <label htmlFor="quiz-group">問題グループ:</label>
          <select
            id="quiz-group"
            value={selectedQuizGroup}
            onChange={(e) => handleGroupSelectionChange(e.target.value)}
          >
            <option value="">-- 選択してください --</option>
            {quizGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
            <option value="new">（新規作成）</option>
          </select>

          {selectedQuizGroup === 'new' && (
            <input
              type="text"
              id="new-group"
              placeholder="新しいグループ名を入力"
              style={{ marginTop: '10px' }}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="number-of-questions">問題数:</label>
          <input
            type="number"
            id="number-of-questions"
            placeholder="例: 10"
            min="1"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            disabled={!selectedQuizGroup} // グループが選択されるまで無効
          />
        </div>

        <div className="form-group">
          <label htmlFor="time-limit">時間設定 (分):</label>
          <input
            type="number"
            id="time-limit"
            placeholder="例: 15"
            min="1"
            value={timeLimitMinutes}
            onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
            disabled={!selectedQuizGroup} // グループが選択されるまで無効
          />
        </div>

        <div className="button-group">
          {renderButton()}
          <button onClick={handleBack}>戻る</button>
        </div>
      </div>
    </div>
  );
}