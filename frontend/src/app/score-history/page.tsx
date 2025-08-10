'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';

// Define the structure of a single score record from the API
interface ScoreRecord {
    QuizSessionId: string;
    GroupId: string;
    UserId: string;
    SubmittedAt: string;
    QuizGroupName: string; // Assuming this is available, adjust if not
    CorrectCount: number;
    TotalCount: number;
}

// Define the structure of the API response
interface ApiResponse {
    scores: ScoreRecord[];
}

declare global {
    interface Window {
        apiClient?: {
            request: (endpoint: string, options?: RequestInit) => Promise<unknown>;
            get: (endpoint: string, options?: RequestInit) => Promise<unknown>;
            post: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
            put: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
            del: (endpoint: string, options?: RequestInit) => Promise<unknown>;
        };
    }
}

export default function ScoreHistoryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const userId = user?.id;
    const [scores, setScores] = useState<ScoreRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchScores = async () => {
        if (!userId) {
            setError("ユーザー情報が取得できません。ログインしているか確認してください。");
            setLoading(false);
            return;
        }
        if (!window.apiClient) {
            setError("APIクライアントの読み込みに失敗しました。");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await window.apiClient.get(`/Prod/scores`) as ApiResponse;
            if (data && Array.isArray(data.scores)) {
                const completedScores = data.scores.filter(score => score.SubmittedAt);

                // Sort by SubmittedAt in descending order (newest first)
                completedScores.sort((a, b) => new Date(b.SubmittedAt).getTime() - new Date(a.SubmittedAt).getTime());

                // Take the top 10
                setScores(completedScores.slice(0, 10));
            } else {
                throw new Error("取得したデータの形式が正しくありません。");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "成績の読み込み中に不明なエラーが発生しました。");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // apiClient.js is loaded via the Script tag, so we wait for it.
        // A simple delay might work for now, but a more robust solution would be preferable.
        const checkApiClient = setInterval(() => {
            if (window.apiClient) {
                clearInterval(checkApiClient);
                fetchScores();
            }
        }, 100); // Check every 100ms

        return () => clearInterval(checkApiClient);
    }, [userId]);

    const handleDelete = async (quizSessionId: string) => {
        if (!window.confirm("この成績記録を本当に削除しますか？")) {
            return;
        }

        if (!window.apiClient) {
            setError("APIクライアントの読み込みに失敗しました。");
            return;
        }

        try {
            await window.apiClient.del(`/Prod/scores/${quizSessionId}`);
            // Refresh the list after deletion
            fetchScores();
        } catch (err) {
            setError(err instanceof Error ? err.message : "削除中にエラーが発生しました。");
            console.error(err);
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString('ja-JP', options);
    };

    return (
        <>
            <Script src="/contents/js/apiClient.js" strategy="beforeInteractive" />
            <div className="score-history-page">
                <Header />

                <div className="container">
                    <h2>成績確認</h2>

                    {loading && <p>成績を読み込んでいます...</p>}
                    {error && <p className="error-message" style={{ color: 'red' }}>エラー: {error}</p>}

                    {!loading && !error && (
                        <>
                            <div className="section">
                                <h3>個別の成績記録</h3>
                                {scores.length > 0 ? (
                                    scores.map((record) => {
                                        const accuracy = record.TotalCount > 0 ? Math.floor((record.CorrectCount / record.TotalCount) * 100) : 0;
                                        return (
                                            <div key={record.QuizSessionId} className="score-record">
                                                <a
                                                    href={`/quiz-result?quizSessionId=${record.QuizSessionId}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        router.push(`/quiz-result?quizSessionId=${record.QuizSessionId}`);
                                                    }}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline', flexGrow: 1 }}
                                                >
                                                    {formatDate(record.SubmittedAt)} - {record.QuizGroupName || `グループID: ${record.GroupId}`} (正答数: {record.CorrectCount}/{record.TotalCount} 正答率: {accuracy}%)
                                                </a>
                                                <button onClick={() => handleDelete(record.QuizSessionId)}>削除</button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p>まだ成績記録がありません。</p>
                                )}
                            </div>

                            {/* Placeholder sections for future implementation */}
                            {/* <div className="section">
                                <h3>グループ別分析</h3>
                                <p>（この機能は現在開発中です）</p>
                            </div>
                            <div className="section">
                                <h3>得点推移グラフ</h3>
                                <div className="graph-placeholder">（グラフ表示は現在開発中です）</div>
                            </div>
                            <div className="section">
                                <h3>苦手傾向分析</h3>
                                <p>（この機能は現在開発中です）</p>
                            </div> */}

                            <div className="action-buttons">
                                {/* <button onClick={() => alert('すべての成績記録を削除します。（機能は未実装）')}>
                                    すべての成績記録を削除
                                </button> */}
                                <button onClick={() => router.push('/quiz-list')}>
                                    問題一覧に戻る
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}