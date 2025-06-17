import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function EarningsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
