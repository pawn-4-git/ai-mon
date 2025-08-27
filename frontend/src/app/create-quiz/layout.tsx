import type { Metadata } from 'next';
import { appTitle } from '@/config';

export const metadata: Metadata = {
  title: `Create Quiz | ${appTitle}`,
};

export default function CreateQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
