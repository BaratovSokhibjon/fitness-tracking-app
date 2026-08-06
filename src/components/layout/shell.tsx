import { Sidebar } from "@/components/layout/sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 bg-canvas">
        <div className="container max-w-5xl py-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
