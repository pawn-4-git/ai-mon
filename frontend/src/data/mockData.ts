import { QuizGroup, Question, Quiz, ScoreRecord, ReferenceBook } from '@/types';

export const mockQuizGroups: QuizGroup[] = [
  {
    id: '1',
    name: '数学基礎',
    status: 'not-taken',
    questionCount: 10,
    timeLimit: 15
  },
  {
    id: '2',
    name: '歴史問題',
    status: 'updated',
    questionCount: 15,
    timeLimit: 20,
    lastScore: 85
  },
  {
    id: '3',
    name: '科学知識',
    status: 'completed',
    questionCount: 12,
    timeLimit: 18,
    lastScore: 92,
    lastTaken: new Date('2024-01-15')
  }
];

export const mockQuestions: Question[] = [
  {
    id: '1',
    text: '日本の首都はどこですか？',
    choices: ['大阪', '東京', '京都', '名古屋'],
    correctAnswer: 1,
    explanation: '日本の首都は東京です。1868年に江戸から東京に改名されました。',
    category: 'geography'
  },
  {
    id: '2',
    text: '2 + 2 = ?',
    choices: ['3', '4', '5', '6'],
    correctAnswer: 1,
    explanation: '2 + 2 = 4です。基本的な足し算の問題です。',
    category: 'math'
  },
  {
    id: '3',
    text: '地球の衛星の名前は何ですか？',
    choices: ['太陽', '月', '火星', '金星'],
    correctAnswer: 1,
    explanation: '地球の唯一の自然衛星は月です。',
    category: 'science'
  }
];

// Updated mockQuiz to include properties required by the Quiz interface
export const mockQuiz: Quiz = {
  id: '1',
  groupId: '1',
  questions: mockQuestions,
  timeLimit: 15,
  createdAt: new Date(),
  // Added missing properties:
  question: '日本の首都はどこですか？',
  correct: '東京',
  explanation: '日本の首都は東京です。1868年に江戸から東京に改名されました。',
  dummies: ['大阪', '京都', '札幌']
};

export const mockScoreRecords: ScoreRecord[] = [
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

export const mockReferenceBooks: ReferenceBook[] = [
  {
    id: '1',
    title: '基礎から学ぶ日本史',
    url: 'https://www.amazon.co.jp/dp/example1',
    description: '日本の歴史を基礎から学べる参考書'
  },
  {
    id: '2',
    title: '数学の基本問題集',
    url: 'https://www.amazon.co.jp/dp/example2',
    description: '基本的な数学問題を網羅した問題集'
  },
  {
    id: '3',
    title: '理科の基礎知識',
    url: 'https://www.amazon.co.jp/dp/example3',
    description: '理科の基礎知識をまとめた参考書'
  },
  {
    id: '4',
    title: '地理の要点整理',
    url: 'https://www.amazon.co.jp/dp/example4',
    description: '地理の重要ポイントをまとめた参考書'
  },
  {
    id: '5',
    title: '英語基礎文法',
    url: 'https://www.amazon.co.jp/dp/example5',
    description: '英語の基礎文法を学べる教材'
  }
];