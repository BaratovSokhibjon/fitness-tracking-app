import { Sidebar } from "@/components/layout/sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-background">
        <div className="container max-w-4xl py-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
