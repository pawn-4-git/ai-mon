import type { Metadata } from 'next';
import { appTitle } from '@/config';

export const metadata: Metadata = {
  title: `Quiz Result | ${appTitle}`,
};

export default function QuizResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
