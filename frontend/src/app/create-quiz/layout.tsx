import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Create Quiz`,
};

export default function CreateQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
