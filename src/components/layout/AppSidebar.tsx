"use client";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarTrigger,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"
import { LayoutDashboard, Receipt, Users, FileText, BarChart3, LogOut, Moon, Sun, ShieldCheck, PlusCircle, UserCog, Building2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

function SidebarBrand({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-4 group-data-[collapsible=icon]:px-0">
      <div className="group/logo relative flex flex-1 items-center gap-3 transition-all duration-300 cursor-pointer group-data-[collapsible=icon]:justify-center">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover/logo:scale-110">
           <ShieldCheck className="h-6 w-6" />
           <div className="absolute inset-0 bg-white/20 rounded-xl blur-[8px] opacity-0 group-hover/logo:opacity-100 transition-opacity" />
        </div>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-black text-foreground tracking-tight">{title}</span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-80">Admin Panel</span>
        </div>
        <SidebarTrigger className="absolute inset-0 hidden items-center justify-center rounded-md opacity-0 pointer-events-none transition-opacity duration-150 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:group-hover/logo:opacity-100 group-data-[collapsible=icon]:group-hover/logo:pointer-events-auto" />
      </div>
      <div className="shrink-0 group-data-[collapsible=icon]:hidden">
        <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

export function AppSidebar({ theme, toggleTheme }: { theme: "light" | "dark"; toggleTheme: () => void }) {
  const pathname = usePathname();
  const { signOut, adminUser } = useAuth();

  const isSuperAdmin = adminUser?.role === 'super_admin';

  return (
    <Sidebar collapsible="icon" className="sidebar-glass">
      <SidebarHeader className="border-b border-sidebar-border/50 py-4">
        <SidebarBrand title="QR Admin" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-2 px-4">Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/transactions'} tooltip="Transactions">
                  <Link href="/transactions">
                    <Receipt className="h-4 w-4" />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/merchants'} tooltip="Merchants">
                  <Link href="/merchants">
                    <Users className="h-5 w-5" />
                    <span>Merchants</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4 my-4 opacity-20 bg-primary/20" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-2 px-4">Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/reports'} tooltip="Reports">
                  <Link href="/reports">
                    <FileText className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/analytics'} tooltip="Analytics">
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isSuperAdmin && (
          <>
            <Separator className="mx-4 my-4 opacity-20 bg-primary/20" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-2 px-4">Company</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/pending-merchants'} tooltip="Pending IDs">
                      <Link href="/admin/pending-merchants">
                        <PlusCircle className="h-4 w-4" />
                        <span>Pending Merchant IDs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/team'} tooltip="Team">
                      <Link href="/admin/team">
                        <UserCog className="h-4 w-4" />
                        <span>Team</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {isSuperAdmin && (
          <>
            <Separator className="mx-4 my-4 opacity-20 bg-primary/20" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-2 px-4">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/manage'} tooltip="Manage Admins">
                      <Link href="/admin/manage">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Manage Admins</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/partners'} tooltip="Partners">
                      <Link href="/admin/partners">
                        <Building2 className="h-4 w-4" />
                        <span>Partners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <Separator className="mx-4 my-4 opacity-20 bg-primary/20" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-2 px-4">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Sign Out">
                  <button onClick={() => signOut()} className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="border-t border-sidebar-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={theme === "light" ? "Dark Mode" : "Light Mode"}>
              <button onClick={toggleTheme} className="flex w-full items-center gap-2">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
