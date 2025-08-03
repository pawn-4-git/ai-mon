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
    resources?: ProductResource[];
}

interface ProductResource {
    ResourceId: string;
    GroupId: string;
    ImageUrl: string;
    ProductName: string;
    ProductUrl: string;
}

function CreateQuizContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [creationMethod, setCreationMethod] = useState('manual');
    const [showDummyChoices, setShowDummyChoices] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [quizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [productResources, setProductResources] = useState<Partial<ProductResource>[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [resourceError, setResourceError] = useState<string | null>(null);
    const [currentGroup, setCurrentGroup] = useState<QuizGroup | null>(null);

    // Form state
    const [quizTitle, setQuizTitle] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [correctChoice, setCorrectChoice] = useState('');
    const [explanationText, setExplanationText] = useState('');
    const [dummyChoices, setDummyChoices] = useState<string[]>([]);
    const [sourceText, setSourceText] = useState('');

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

    const fetchResources = useCallback(async (groupId: string) => {
        if (!window.apiClient) return;
        setIsLoadingResources(true);
        setResourceError(null);
        try {
            // The raw response from the backend API
            interface ApiResource {
                ResourceId: string;
                GroupId: string;
                Title: string;
                URL: string;
                ImgSrc?: string;
            }
            interface ApiResponse {
                resources?: ApiResource[];
            }

            const data = await window.apiClient.get(`/Prod/quiz-groups/${groupId}/resources`) as ApiResponse;
            
            if (data && data.resources) {
                // Map the API response to the frontend's ProductResource type
                const formattedResources: ProductResource[] = data.resources.map(res => ({
                    ResourceId: res.ResourceId,
                    GroupId: res.GroupId,
                    ProductName: res.Title,
                    ProductUrl: res.URL,
                    ImageUrl: res.ImgSrc || '',
                }));
                setProductResources(formattedResources);
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
            setResourceError('関連商品の読み込みに失敗しました。');
        } finally {
            setIsLoadingResources(false);
        }
    }, []);

    useEffect(() => {
        const groupId = searchParams.get('id');
        const groupName = searchParams.get('name');
        if (groupId) {
            setCurrentGroup({
                id: groupId,
                name: decodeURIComponent(groupName || ''),
                questionCount: 0, // This might need to be fetched or passed as well
                timeLimit: 0,   // Same as above
                status: 'not-taken'
            });
            fetchResources(groupId);
        }
    }, [searchParams, fetchResources]);


    const resetForm = () => {
        setQuizTitle('');
        setQuestionText('');
        setCorrectChoice('');
        setExplanationText('');
        setDummyChoices([]);
        setShowDummyChoices(false);
        setSourceText('');
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
        if (dummyChoices.length < 1) {
            alert('ダミーの選択肢を1つ以上生成してください。');
            return;
        }

        if (!window.apiClient) {
            alert('APIクライアントの準備ができていません。');
            return;
        }

        const requestBody = {
            type: 'manual',
            title: quizTitle,
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

    const handleGenerateQuestion = async () => {
        if (!currentGroup) {
            alert('問題グループが設定されていません。');
            return;
        }
        if (!sourceText) {
            alert('生成元の文章を入力してください。');
            return;
        }

        if (!window.apiClient) {
            alert('APIクライアントの準備ができていません。');
            return;
        }

        interface AiGenerateQuestionResponse {
            questionText: string;
            correctChoice: string;
            incorrectChoices: string[];
            explanation: string;
        }

        try {
            const response = await window.apiClient.post(
                `/Prod/ai/generate-question`,
                { sourceText, groupId: currentGroup.id }
            ) as AiGenerateQuestionResponse;

            if (response && response.questionText) {
                setQuestionText(response.questionText);
                setCorrectChoice(response.correctChoice);
                setDummyChoices(response.incorrectChoices);
                setExplanationText(response.explanation);
                setShowDummyChoices(true);
                setCreationMethod('manual');
                alert('問題が自動生成されました。内容を確認・修正して保存してください。');
            } else {
                alert('問題の自動生成に失敗しました。');
            }
        } catch (error) {
            console.error('Failed to generate question:', error);
            alert('問題の自動生成中にエラーが発生しました。');
        }
    };

    const handleDeleteChoice = (indexToDelete: number) => {
        setDummyChoices(prevChoices => prevChoices.filter((_, index) => index !== indexToDelete));
    };

    const handleCreationMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCreationMethod(e.target.value);
    };

    const handleResourceChange = (index: number, field: keyof ProductResource, value: string) => {
        const newResources = [...productResources];
        const resourceToUpdate = { ...newResources[index], [field]: value };
        newResources[index] = resourceToUpdate;
        setProductResources(newResources);
    };

    const addProductResourceField = () => {
        if (productResources.length < 10) {
            setProductResources([...productResources, { ResourceId: `new-${Date.now()}`, GroupId: currentGroup?.id || '', ImageUrl: '', ProductName: '', ProductUrl: '' }]);
        } else {
            alert('追加できる商品リンクは最大10個までです。');
        }
    };

    const removeProductResourceField = async (index: number) => {
        if (!window.apiClient) {
            alert('APIクライアントの準備ができていません。');
            return;
        }

        const resourceToDelete = productResources[index];
        
        // Only call API if the resource exists in the database (i.e., has a real ResourceId)
        if (resourceToDelete.ResourceId && !resourceToDelete.ResourceId.startsWith('new-')) {
            try {
                await window.apiClient.del(`/Prod/resources/${resourceToDelete.ResourceId}`);
                alert('商品リンクを削除しました。');
            } catch (error) {
                console.error('Failed to delete resource:', error);
                alert('商品リンクの削除に失敗しました。');
                return; // Stop execution if API call fails
            }
        }

        const newResources = productResources.filter((_, i) => i !== index);
        setProductResources(newResources);
    };

    const handleSaveResources = async () => {
        if (!currentGroup) {
            alert('問題グループが設定されていません。');
            return;
        }
        if (!window.apiClient) {
            alert('APIクライアントの準備ができていません。');
            return;
        }

        const newResources = productResources.filter(r => r.ResourceId && r.ResourceId.startsWith('new-'));

        if (newResources.length === 0) {
            alert('保存する新しい商品リンクがありません。');
            return;
        }

        try {
            for (const resource of newResources) {
                const payload = {
                    title: resource.ProductName,
                    url: resource.ProductUrl,
                    imgSrc: resource.ImageUrl,
                };
                await window.apiClient.post(`/Prod/quiz-groups/${currentGroup.id}/resources`, payload);
            }
            alert('新しい商品リンクを保存しました。');
            fetchResources(currentGroup.id); // Refresh the list to get new ResourceIds
        } catch (error) {
            console.error('Failed to save new resources:', error);
            alert('商品リンクの保存に失敗しました。');
        }
    };


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

                    <p>現在のグループ: <span id="current-group">{currentGroup ? `${currentGroup.name} (ID: ${currentGroup.id})` : '未設定'}</span></p>
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
                        <button onClick={handleGenerateDummies}>ダミー選択肢を10���生成</button>

                        {showDummyChoices && (
                            <div className="dummy-choices">
                                <h3>生成されたダミー選択肢:</h3>
                                <ul>
                                    {dummyChoices.map((choice, i) => (
                                        <li key={i}>
                                            {choice}
                                            <button onClick={() => handleDeleteChoice(i)} style={{ marginLeft: '10px', cursor: 'pointer', color: 'red', border: 'none', background: 'none' }}>×</button>
                                        </li>
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
                        <div className="form-group">
                            <label htmlFor="source-text">生成元の文章:</label>
                            <textarea id="source-text" placeholder="問題生成の元となる文章を入力してください" value={sourceText} onChange={(e) => setSourceText(e.target.value)}></textarea>
                        </div>
                        <button onClick={handleGenerateQuestion}>問題を自動生成</button>
                    </div>

                    <div className="button-group">
                        <button onClick={handleSaveQuestion}>問題を保存</button>
                        <button className="secondary" onClick={() => router.push('/quiz-list')}>キャンセル</button>
                        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#17a2b8' }}>問題の一覧を確認</button>
                    </div>

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
                        <p style={{ fontSize: '0.9em', color: '#777' }}>問題に関連する商品の画像URL、商品名、商品リンクを入力してください。</p>
                        
                        {isLoadingResources && <p>関連商品を読み込み中...</p>}
                        {resourceError && <p style={{ color: 'red' }}>{resourceError}</p>}

                        {!isLoadingResources && !resourceError && (
                            <>
                                <div id="product-links-container">
                                    {productResources.map((resource, index) => (
                                        <div key={resource.ResourceId || index} className="product-link-item" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                                            {resource.ImageUrl && (
                                                <a href={resource.ProductUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ marginRight: '15px' }}>
                                                    <img src={resource.ImageUrl} alt={resource.ProductName || '商品画像'} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                                </a>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <h4>
                                                    <a href={resource.ProductUrl || '#'} target="_blank" rel="noopener noreferrer">
                                                        商品リンク {index + 1}: {resource.ProductName || '(名称未設定)'}
                                                    </a>
                                                </h4>
                                                <div className="form-group">
                                                    <label htmlFor={`product-image-url-${index}`}>画像URL:</label>
                                                    <input type="text" id={`product-image-url-${index}`} placeholder="例: https://example.com/image.jpg" value={resource.ImageUrl || ''} onChange={(e) => handleResourceChange(index, 'ImageUrl', e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`product-name-${index}`}>商品名:</label>
                                                    <input type="text" id={`product-name-${index}`} placeholder="例: 商品A" value={resource.ProductName || ''} onChange={(e) => handleResourceChange(index, 'ProductName', e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`product-link-url-${index}`}>商品リンクURL:</label>
                                                    <input type="text" id={`product-link-url-${index}`} placeholder="例: https://example.com/product/A" value={resource.ProductUrl || ''} onChange={(e) => handleResourceChange(index, 'ProductUrl', e.target.value)} />
                                                </div>
                                                <button onClick={() => removeProductResourceField(index)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>削除</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addProductResourceField} style={{ marginTop: '15px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>商品リンクを追加</button>
                                <button onClick={handleSaveResources} style={{ marginTop: '15px', marginLeft: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>商品リンクを保存</button>
                            </>
                        )}
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