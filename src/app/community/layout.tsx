import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
