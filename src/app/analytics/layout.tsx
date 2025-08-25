
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
