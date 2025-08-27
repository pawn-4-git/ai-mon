import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Quiz Play`,
};

export default function QuizPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
