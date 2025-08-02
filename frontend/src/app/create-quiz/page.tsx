'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import { Quiz, QuizGroup } from '@/types/index';

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

interface LambdaQuizGroup {
    GroupId: string;
    Name: string;
    QuestionCount: number;
    TimeLimitMinutes: number;
    CreatedAt: string;
    CreatedBy: string;
}

interface ApiResponse {
    message?: string;
    groups?: LambdaQuizGroup[];
}

function CreateQuizContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [creationMethod, setCreationMethod] = useState('manual');
    const [showDummyChoices, setShowDummyChoices] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [quizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [productLinks, setProductLinks] = useState<object[]>([{}]);
    const [currentGroup, setCurrentGroup] = useState<QuizGroup | null>(null);

    // Form state
    const [quizTitle, setQuizTitle] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [correctChoice, setCorrectChoice] = useState('');
    const [explanationText, setExplanationText] = useState('');
    const [dummyChoices, setDummyChoices] = useState<string[]>([]);


    const fetchQuizGroups = useCallback(async () => {
        if (!window.apiClient) {
            console.error('API client is not loaded yet.');
            return;
        }
        try {
            const data = await window.apiClient.get('/Prod/quiz-groups') as ApiResponse;
            if (data && data.groups && Array.isArray(data.groups)) {
                const formattedGroups: QuizGroup[] = data.groups.map((group: LambdaQuizGroup) => ({
                    id: group.GroupId,
                    name: group.Name,
                    questionCount: group.QuestionCount,
                    timeLimit: group.TimeLimitMinutes,
                    status: 'not-taken',
                }));

                const groupId = searchParams.get('id');
                if (groupId) {
                    const foundGroup = formattedGroups.find(group => group.id === groupId);
                    setCurrentGroup(foundGroup || null);
                }
            } else {
                console.error('Unexpected data format:', data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [searchParams]);

    const resetForm = () => {
        setQuizTitle('');
        setQuestionText('');
        setCorrectChoice('');
        setExplanationText('');
        setDummyChoices([]);
        setShowDummyChoices(false);
    };

    const handleSaveQuestion = async () => {
        if (!currentGroup) {
            alert('問題グループが設定されていません。');
            return;
        }
        if (!quizTitle || !questionText || !correctChoice || !explanationText) {
            alert('すべての項目を入力してください。');
            return;
        }
        if (dummyChoices.length !== 10) {
            alert('ダミーの選択肢を10個生成してください。');
            return;
        }

        if (!window.apiClient) {
            alert('APIクライアントの準備ができていません。');
            return;
        }

        const requestBody = {
            type: 'manual',
            questionText: questionText,
            correctChoice: correctChoice,
            incorrectChoices: dummyChoices,
            explanation: explanationText,
        };

        try {
            await window.apiClient.post(`/Prod/quiz-groups/${currentGroup.id}/questions`, requestBody);
            alert('登録が完了しました。');
            resetForm();
        } catch (error) {
            console.error('Failed to save question:', error);
            alert('問題の保存に失敗しました。');
        }
    };

    const handleGenerateDummies = async () => {
        if (!questionText || !correctChoice) {
            alert('ダミー選択肢を生成するには、問題文と正解の選択肢を入力してください。');
            return;
        }

        if (!window.apiClient) {
            alert('APIクライアントの準備ができていません。');
            return;
        }

        const requestBody = {
            questionContext: questionText,
            correctChoice: correctChoice,
        };

        try {
            const response = await window.apiClient.post('/Prod/ai/generate-choices', requestBody) as { incorrectChoices: string[] };
            if (response && response.incorrectChoices) {
                setDummyChoices(response.incorrectChoices);
                setShowDummyChoices(true);
                alert('ダミー選択肢を生成しました。');
            } else {
                alert('ダミー選択肢の生成に失敗しました。');
            }
        } catch (error) {
            console.error('Failed to generate dummy choices:', error);
            alert('ダミー選択肢の生成中にエラーが発生しました。');
        }
    };

    const handleCreationMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCreationMethod(e.target.value);
    };

    const addProductLinkField = useCallback(() => {
        if (productLinks.length < 10) {
            setProductLinks([...productLinks, {}]);
        } else {
            alert('追加できる商品リンクは最大10個までです。');
        }
    }, [productLinks]);

    const removeProductLinkField = (index: number) => {
        const newProductLinks = productLinks.filter((_, i) => i !== index);
        setProductLinks(newProductLinks);
    };

    useEffect(() => {
        if (productLinks.length === 0) {
            addProductLinkField();
        }
    }, [addProductLinkField, productLinks.length]);

    return (
        <>
            <Script
                src="/contents/js/apiClient.js"
                strategy="beforeInteractive"
                onLoad={fetchQuizGroups}
            />
            <div className="create-quiz-page">
                <Header />

                <div className="container">
                    <h2>新しい問題を作成</h2>

                    <div className="form-group">
                        <label htmlFor="quiz-title">問題タイトル:</label>
                        <input type="text" id="quiz-title" placeholder="例: 日本史の基礎" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
                    </div>

                    <p>現在のグループ: <span id="current-group">{currentGroup ? currentGroup.name : '未設定'}</span></p>
                    <div className="form-group">
                        <Link href="/quiz-group">問題グループを設定</Link>
                    </div>

                    <div className="radio-group">
                        <label>
                            <input type="radio" name="creation-method" value="manual" checked={creationMethod === 'manual'} onChange={handleCreationMethodChange} />
                            手動作成
                        </label>
                        <label>
                            <input type="radio" name="creation-method" value="auto" checked={creationMethod === 'auto'} onChange={handleCreationMethodChange} />
                            自動生成
                        </label>
                    </div>

                    {/* Manual Creation Section */}
                    <div id="manual-creation" style={{ display: creationMethod === 'manual' ? 'block' : 'none' }}>
                        <div className="form-group">
                            <label htmlFor="question-text">問題文:</label>
                            <textarea id="question-text" placeholder="問題文を入力してください" value={questionText} onChange={(e) => setQuestionText(e.target.value)}></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="correct-choice">正解の選択肢:</label>
                            <input type="text" id="correct-choice" placeholder="正解の選択肢を入力してください" value={correctChoice} onChange={(e) => setCorrectChoice(e.target.value)} />
                        </div>
                        <button onClick={handleGenerateDummies}>ダミー選択肢を10個生成</button>

                        {showDummyChoices && (
                            <div className="dummy-choices">
                                <h3>生成されたダミー選択肢:</h3>
                                <ul>
                                    {dummyChoices.map((choice, i) => (
                                        <li key={i}>{choice}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="explanation-text">解説文:</label>
                            <textarea id="explanation-text" placeholder="解説文を入力してください" value={explanationText} onChange={(e) => setExplanationText(e.target.value)}></textarea>
                        </div>
                    </div>

                    {/* Auto Generation Section */}
                    <div id="auto-generation" style={{ display: creationMethod === 'auto' ? 'block' : 'none' }}>
                        {/* ... auto-generation content ... */}
                    </div>

                    <div className="button-group">
                        <button onClick={handleSaveQuestion}>問題を保存</button>
                        <button className="secondary" onClick={() => router.push('/quiz-list')}>キャンセル</button>
                        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#17a2b8' }}>問題の一覧を確認</button>
                    </div>

                    {/* ... rest of the component ... */}
                    {isModalOpen && (
                        <div className="modal" style={{ display: 'block' }}>
                            <div className="modal-content">
                                <span className="close-button" onClick={() => { setIsModalOpen(false); setSelectedQuiz(null); }}>&times;</span>
                                {!selectedQuiz ? (
                                    <>
                                        <h2>問題一覧</h2>
                                        <div id="quiz-list-container">
                                            <ul>
                                                {quizzes.map(quiz => (
                                                    <li key={quiz.id} onClick={() => setSelectedQuiz(quiz)}>
                                                        {quiz.question}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <div id="quiz-detail-container">
                                        <h3>問題詳細</h3>
                                        <p><strong>問題文:</strong> {selectedQuiz.question}</p>
                                        <p><strong>正解:</strong> {selectedQuiz.correct}</p>
                                        <p><strong>解説:</strong> {selectedQuiz.explanation}</p>
                                        <p><strong>誤った回答:</strong> {selectedQuiz.dummies.join(', ')}</p>
                                        <button onClick={() => setSelectedQuiz(null)} style={{ marginTop: '15px', padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>一覧に戻る</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                     <div className="product-links-section" style={{ marginTop: '30px' }}>
                    <h3>関連商品リンク (最大10個)</h3>
                    <p style={{ fontSize: '0.9em', color: '#777' }}>問題に関連する商品の画像URL、商品��、商品リンクを入力してください。</p>
                    <div id="product-links-container">
                        {productLinks.map((link, index) => (
                            <div key={index} className="product-link-item" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                                <h4>商品リンク {index + 1}</h4>
                                <div className="form-group">
                                    <label htmlFor={`product-image-url-${index}`}>画像URL:</label>
                                    <input type="text" id={`product-image-url-${index}`} placeholder="例: https://example.com/image.jpg" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`product-name-${index}`}>商品名:</label>
                                    <input type="text" id={`product-name-${index}`} placeholder="例: 商品A" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`product-link-url-${index}`}>商品リンクURL:</label>
                                    <input type="text" id={`product-link-url-${index}`} placeholder="例: https://example.com/product/A" />
                                </div>
                                <button onClick={() => removeProductLinkField(index)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>削除</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addProductLinkField} style={{ marginTop: '15px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>商品リンクを追加</button>
                    <button onClick={() => alert('商品リンクを保存します。（機能は未実装）')} style={{ marginTop: '15px', marginLeft: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>商品リンクを保存</button>
                </div>
                </div>
            </div>
        </>
    );
}

export default function CreateQuizPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateQuizContent />
        </Suspense>
    );
}