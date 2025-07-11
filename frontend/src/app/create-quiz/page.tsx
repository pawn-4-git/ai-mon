'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

// Mock data for quizzes
const mockQuizzes = [
    { id: 1, question: '日本の首都はどこですか？', correct: '東京', explanation: '東京は日本の政治、経済、文化の中心です。', dummies: ['大阪', '京都', '札幌'] },
    { id: 2, question: '世界で一番高い山は何ですか？', correct: 'エベレスト', explanation: 'エベレストはヒマラヤ山脈に位置し、標高8,848.86メートルです。', dummies: ['K2', '富士山', 'キリマンジャロ'] },
    { id: 3, question: '光の速さは約何km/sですか？', correct: '30万km/s', explanation: '光速は真空中で約299,792.458 km/sです。', dummies: ['3万km/s', '300万km/s', '3千km/s'] }
];

export default function CreateQuizPage() {
    const router = useRouter();
    const [creationMethod, setCreationMethod] = useState('manual');
    const [showDummyChoices, setShowDummyChoices] = useState(false);
    const [showAutoDummyChoices, setAutoShowDummyChoices] = useState(false);
    const [showGeneratedQuiz, setShowGeneratedQuiz] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quizzes, setQuizzes] = useState(mockQuizzes);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [productLinks, setProductLinks] = useState([{}]);

    const handleCreationMethodChange = (e) => {
        setCreationMethod(e.target.value);
    };

    const addProductLinkField = () => {
        if (productLinks.length < 10) {
            setProductLinks([...productLinks, {}]);
        } else {
            alert('追加できる商品リンクは最大10個までです。');
        }
    };

    const removeProductLinkField = (index) => {
        const newProductLinks = productLinks.filter((_, i) => i !== index);
        setProductLinks(newProductLinks);
    };
    
    useEffect(() => {
        // Add one product link field by default
        addProductLinkField();
    }, []);


    return (
        <div className="create-quiz-page">
            <Header />

            <div className="container">
                <h2>新しい問題を作成</h2>

                <div className="form-group">
                    <label htmlFor="quiz-title">問題タイトル:</label>
                    <input type="text" id="quiz-title" placeholder="例: 日本史の基礎" />
                </div>

                <p>現在のグループ: <span id="current-group">未設定</span></p>
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
                        <textarea id="question-text" placeholder="問題文を入力してください"></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="correct-choice">正解の選択肢:</label>
                        <input type="text" id="correct-choice" placeholder="正解の選択肢を入力してください" />
                    </div>
                    <button onClick={() => {setShowDummyChoices(true); alert('ダミー選択肢を生成しました。（機能は未実装）');}}>ダミー選択肢を10個生成</button>

                    {showDummyChoices && (
                        <div className="dummy-choices">
                            <h3>生成されたダミー選択肢 (3つ選択):</h3>
                            <ul>
                                {Array.from({ length: 10 }, (_, i) => (
                                    <li key={i}><label><input type="checkbox" name="dummy-choice" /> ダミー選択肢{i + 1}</label></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="explanation-text">解説文:</label>
                        <textarea id="explanation-text" placeholder="解説文を入力してください"></textarea>
                    </div>
                </div>

                {/* Auto Generation Section */}
                <div id="auto-generation" style={{ display: creationMethod === 'auto' ? 'block' : 'none' }}>
                    <div className="form-group">
                        <label htmlFor="source-text">問題生成元となる文章:</label>
                        <textarea id="source-text" placeholder="問題を作成したい文章を入力してください"></textarea>
                    </div>
                    <button onClick={() => {setShowGeneratedQuiz(true); alert('文章から問題を自動生成しました。（機能は未実装）');}}>文章から問題を自動生成</button>
                    
                    {showGeneratedQuiz && (
                        <div className="generated-quiz" style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                            <h3>生成された問題（確認・修正）:</h3>
                            <div className="form-group">
                                <label>問題文:</label>
                                <textarea id="generated-question-text" defaultValue="（自動生成された問題文）"></textarea>
                            </div>
                            <div className="form-group">
                                <label>正解の選択肢:</label>
                                <input type="text" id="generated-correct-choice" defaultValue="（自動生成された正解）" />
                            </div>
                            <button onClick={() => {setAutoShowDummyChoices(true); alert('ダミー選択肢を生成しました。（機能は未実装）');}}>ダミー選択肢を10個生成</button>
                            {showAutoDummyChoices && (
                                <div className="dummy-choices-auto">
                                    <h3>生成されたダ���ー選択肢 (3つ選択):</h3>
                                    <ul>
                                        {Array.from({ length: 10 }, (_, i) => (
                                            <li key={i}><label><input type="checkbox" name="dummy-choice-auto" /> ダミー選択肢{String.fromCharCode(65 + i)}</label></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="form-group">
                                <label>解説文:</label>
                                <textarea id="generated-explanation-text" defaultValue="（自動生成された解説）"></textarea>
                            </div>
                        </div>
                    )}
                </div>

                <div className="button-group">
                    <button onClick={() => alert('問題を保存します。')}>問題を保存</button>
                    <button className="secondary" onClick={() => router.push('/quiz-list')}>キャンセル</button>
                    <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#17a2b8' }}>問題の一覧を確認</button>
                </div>

                {/* Quiz List Modal */}
                {isModalOpen && (
                    <div className="modal" style={{ display: 'block' }}>
                        <div className="modal-content">
                            <span className="close-button" onClick={() => {setIsModalOpen(false); setSelectedQuiz(null);}}>&times;</span>
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
    );
}