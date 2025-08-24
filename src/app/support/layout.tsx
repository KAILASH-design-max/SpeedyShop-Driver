
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
