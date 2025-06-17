import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function SmartRoutingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
