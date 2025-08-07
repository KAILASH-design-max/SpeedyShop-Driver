import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
