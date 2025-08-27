import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Score History`,
};

export default function ScoreHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
