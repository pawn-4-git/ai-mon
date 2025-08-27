import type { Metadata } from 'next';
import { appTitle } from '@/config';

export const metadata: Metadata = {
  title: `Quiz Group ${appTitle}`,
};

export default function QuizGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
