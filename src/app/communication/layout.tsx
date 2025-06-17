import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
