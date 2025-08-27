import type { Metadata } from 'next';
import { appTitle } from '@/config';

export const metadata: Metadata = {
  title: `Score History | ${appTitle}`,
};

export default function ScoreHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
