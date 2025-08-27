import type { Metadata } from 'next';
import { appTitle } from '@/config';

export const metadata: Metadata = {
  title: `Terms | ${appTitle}`,
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
