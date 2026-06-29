import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronsUpDown, ClipboardList, LogOut, Settings, ShieldCheck, Workflow } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    to: "/wizard" as const,
    label: "Onboarding",
    icon: Workflow,
    requiresAdmin: false,
  },
  {
    to: "/settings" as const,
    label: "Settings",
    icon: Settings,
    requiresAdmin: false,
  },
  {
    to: "/status" as const,
    label: "Onboarding status",
    icon: ClipboardList,
    requiresAdmin: false,
    children: [
      {
        to: "/status/requests" as const,
        label: "My requests",
      },
      {
        to: "/status/credentials" as const,
        label: "My credentials",
      },
      {
        to: "/status/audit" as const,
        label: "My audit trail",
      },
    ],
  },
  {
    to: "/admin" as const,
    label: "Governance",
    icon: ShieldCheck,
    requiresAdmin: true,
    children: [
      {
        to: "/admin/incoming" as const,
        label: "Incoming requests",
      },
      {
        to: "/admin/resolved" as const,
        label: "Resolved requests",
      },
      {
        to: "/admin/credentials" as const,
        label: "VC issuance",
      },
      {
        to: "/admin/revoke" as const,
        label: "VC revocation",
      },
    ],
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { state, isMobile } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = navigationItems.filter((item) => !item.requiresAdmin || isAdmin);
  const userName = (user?.profile?.name || user?.profile?.preferred_username || "Signed in user") as string;
  const userEmail = (user?.profile?.email || "") as string;
  const initials = useMemo(
    () =>
      userName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U",
    [userName],
  );

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const item of visibleItems) {
        if (!item.children?.length) continue;
        if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
          next[item.to] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [userMenuOpen]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="pointer-events-none">
              <div>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">DataSpace</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Onboarding Portal</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    {item.children?.length ? (
                      <>
                        <SidebarMenuButton
                          isActive={
                            pathname === item.to ||
                            pathname.startsWith(`${item.to}/`) ||
                            item.children.some((child) => pathname === child.to || pathname.startsWith(`${child.to}/`))
                          }
                          onClick={() =>
                            setExpandedSections((prev) => ({
                              ...prev,
                              [item.to]: !prev[item.to],
                            }))
                          }
                        >
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform ${expandedSections[item.to] ? "rotate-180" : ""}`}
                          />
                        </SidebarMenuButton>
                        {expandedSections[item.to] && (
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.to}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === child.to || pathname.startsWith(`${child.to}/`)}
                                >
                                  <Link to={child.to}>
                                    <span>{child.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={pathname === item.to || pathname.startsWith(`${item.to}/`)}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {isAuthenticated && (
          <SidebarMenu>
            <SidebarMenuItem className="relative">
              <div ref={userMenuRef}>
                <SidebarMenuButton
                  size="lg"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  data-state={userMenuOpen ? "open" : "closed"}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent font-medium text-sidebar-accent-foreground">
                    {initials}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {userEmail || "No email available"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>

                {userMenuOpen && (
                  <div
                    className={
                      "absolute z-50 min-w-52 rounded-lg border border-sidebar-border bg-sidebar p-1 shadow-lg " +
                      (isMobile || state === "expanded" ? "right-0 bottom-14" : "bottom-0 left-12")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <LogOut className="size-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
