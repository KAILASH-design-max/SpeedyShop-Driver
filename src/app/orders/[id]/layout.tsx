import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function OrderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
