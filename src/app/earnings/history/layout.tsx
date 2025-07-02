import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function EarningsHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
