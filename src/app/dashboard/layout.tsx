import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function DashboardFeatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
