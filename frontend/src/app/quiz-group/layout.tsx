import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Quiz Group`,
};

export default function QuizGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
