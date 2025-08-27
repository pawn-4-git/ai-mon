import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Answer Status`,
};

export default function AnswerStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
