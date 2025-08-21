
"use client";

interface DashboardHeaderProps {}

export function DashboardHeader({}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-card border">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Manage your status and view active orders.</p>
    </div>
  );
}
