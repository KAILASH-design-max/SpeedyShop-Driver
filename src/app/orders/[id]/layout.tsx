
// This layout is now handled by the parent /orders/layout.tsx to avoid nesting.
export default function OrderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
