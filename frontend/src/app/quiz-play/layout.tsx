import type { Metadata } from 'next';
import { appTitle } from '@/config';

export const metadata: Metadata = {
  title: `Quiz Play | ${appTitle}`,
};

export default function QuizPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
