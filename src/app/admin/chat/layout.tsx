import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function AdminChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
