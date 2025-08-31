export interface User {
  id: string;
  username: string;
  email: string;
}

export interface QuizGroup {
  id: string;
  name: string;
  status: 'not-taken' | 'updated' | 'completed';
  questionCount: number;
  timeLimit: number;
  lastScore?: number;
  lastTaken?: Date;
}

export interface Question {
  id: string;
  text: string;
  choices: string[];
  correctAnswer: number;
  explanation?: string;
  category?: string;
}

export interface Quiz {
  id: string;
  groupId: string;
  questions: Question[];
  timeLimit: number;
  createdAt: Date;
  // Added missing properties to match the expected type for selectedQuiz
  question: string;
  correct: string;
  explanation: string;
  dummies: string[];
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer?: number;
  isCorrect?: boolean;
  markedForReview: boolean;
}

export interface QuizSession {
  id: string;
  quizId: string;
  userId: string;
  answers: QuizAnswer[];
  startTime: Date;
  endTime?: Date;
  score?: number;
  currentQuestionIndex: number;
  timeRemaining: number;
}

export interface QuizResult {
  id: string;
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  answers: QuizAnswer[];
}

export interface ScoreRecord {
  id: string;
  groupName: string;
  score: number;
  totalQuestions: number;
  date: Date;
  timeSpent: number;
}

export interface ReferenceBook {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface SampleQuestion {
  CorrectChoice: string;
  CreatedAt: string;
  CreatedBy: string;
  Explanation: string;
  GroupId: string;
  IncorrectChoices: string[];
  QuestionId: string;
  QuestionText: string;
}
