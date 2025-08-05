
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function PenaltiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
