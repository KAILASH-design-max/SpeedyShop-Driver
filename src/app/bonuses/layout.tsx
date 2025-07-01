import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function BonusesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
