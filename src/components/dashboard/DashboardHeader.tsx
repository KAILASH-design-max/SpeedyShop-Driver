
"use client";

interface DashboardHeaderProps {
  // No props needed now
}

export function DashboardHeader({}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 className="text-3xl font-bold text-primary">Driver Dashboard</h1>
    </div>
  );
}
