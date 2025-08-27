import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `問題集一覧`,
};

export default function QuizListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
