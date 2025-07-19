import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
