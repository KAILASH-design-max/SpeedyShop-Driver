
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
