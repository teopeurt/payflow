
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
}
