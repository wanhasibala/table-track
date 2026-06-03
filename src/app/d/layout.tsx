import { Card } from "@/components/ui/card";
import Header from "./header";
import Sidebar from "./sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider className="overflow-hidden max-h-[100vh]">
      <div className="flex w-full h-screen overflow-hidden">
        <Sidebar />
        <div className="w-full flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden bg-background p-4">
            <Card className="h-full w-full rounded-md overflow-auto p-2">
              {children}
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
export default Layout;
