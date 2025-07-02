import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function RatingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
