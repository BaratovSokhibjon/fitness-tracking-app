import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabs } from "@/components/layout/mobile-tabs";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 bg-canvas pb-16 md:pb-0">
        <div className="container max-w-5xl py-8 md:py-10">{children}</div>
      </main>
      <MobileTabs />
    </div>
  );
}
