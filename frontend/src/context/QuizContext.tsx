'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { QuizSession, Quiz } from '@/types';

interface QuizContextType {
  currentSession: QuizSession | null;
  startQuiz: (quiz: Quiz) => void;
  answerQuestion: (questionId: string, answer: number) => void;
  markForReview: (questionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishQuiz: () => void;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const startQuiz = (quiz: Quiz) => {
    const session: QuizSession = {
      id: Date.now().toString(),
      quizId: quiz.id,
      userId: '1',
      answers: quiz.questions.map(q => ({
        questionId: q.id,
        markedForReview: false
      })),
      startTime: new Date(),
      currentQuestionIndex: 0,
      timeRemaining: quiz.timeLimit * 60
    };
    setCurrentSession(session);
    setTimeRemaining(quiz.timeLimit * 60);
  };

  const answerQuestion = (questionId: string, answer: number) => {
    if (!currentSession) return;

    const updatedAnswers = currentSession.answers.map(a =>
      a.questionId === questionId
        ? { ...a, selectedAnswer: answer }
        : a
    );

    setCurrentSession({
      ...currentSession,
      answers: updatedAnswers
    });
  };

  const markForReview = (questionId: string) => {
    if (!currentSession) return;

    const updatedAnswers = currentSession.answers.map(a =>
      a.questionId === questionId
        ? { ...a, markedForReview: !a.markedForReview }
        : a
    );

    setCurrentSession({
      ...currentSession,
      answers: updatedAnswers
    });
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    setCurrentSession({
      ...currentSession,
      currentQuestionIndex: Math.min(
        currentSession.currentQuestionIndex + 1,
        currentSession.answers.length - 1
      )
    });
  };

  const previousQuestion = () => {
    if (!currentSession) return;

    setCurrentSession({
      ...currentSession,
      currentQuestionIndex: Math.max(currentSession.currentQuestionIndex - 1, 0)
    });
  };

  const finishQuiz = () => {
    if (!currentSession) return;

    setCurrentSession({
      ...currentSession,
      endTime: new Date()
    });
  };

  return (
    <QuizContext.Provider value={{
      currentSession,
      startQuiz,
      answerQuestion,
      markForReview,
      nextQuestion,
      previousQuestion,
      finishQuiz,
      timeRemaining,
      setTimeRemaining
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
