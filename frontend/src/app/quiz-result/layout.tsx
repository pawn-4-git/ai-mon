import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Quiz Result`,
};

export default function QuizResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
