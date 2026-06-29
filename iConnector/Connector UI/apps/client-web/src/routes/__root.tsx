import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar.tsx";
import { ThemeToggle } from "@/components/theme/theme-toggle.tsx";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center justify-between border-b border-border px-6">
              <div className="flex items-center">
                <SidebarTrigger />
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-foreground">Eclipse Dataspace Connector</h2>
                </div>
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <TanStackRouterDevtools />
    </>
  );
}
