import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Link, useLocation } from 'wouter';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Settings, 
  LogOut,
  HardHat,
  Target
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAppContext();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const getNavItems = () => {
    switch (user.role) {
      case 'manager':
        return [
          { label: 'Dashboard', path: '/manager', icon: LayoutDashboard },
          { label: 'Leads', path: '/manager/leads', icon: Target },
          { label: 'Quotes', path: '/manager/quotes', icon: FileText },
          { label: 'Jobs', path: '/manager/jobs', icon: Briefcase },
          { label: 'Users', path: '/manager/users', icon: Users },
          { label: 'Settings', path: '/manager/settings', icon: Settings },
        ];
      case 'sales':
        return [
          { label: 'Dashboard', path: '/sales', icon: LayoutDashboard },
          { label: 'Leads', path: '/sales/leads', icon: Target },
          { label: 'Quotes', path: '/sales/quotes', icon: FileText },
        ];
      case 'field_staff':
        return [
          { label: 'Dashboard', path: '/field', icon: LayoutDashboard },
          { label: 'My Jobs', path: '/field/jobs', icon: HardHat },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background no-print">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-primary">
              <HardHat className="h-6 w-6" />
              <span>FSM.IO</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="mt-4">
                  {navItems.map((item) => {
                    const isActive = location === item.path || (location.startsWith(item.path) && item.path !== '/manager' && item.path !== '/sales' && item.path !== '/field');
                    
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive} className="font-medium">
                          <Link href={item.path} className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-9 w-9 rounded-md">
                <AvatarFallback className="bg-primary/20 text-primary rounded-md uppercase font-bold">
                  {user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">{user.name}</span>
                <span className="text-xs text-muted-foreground uppercase mt-0.5">{user.role?.replace('_', ' ')}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b flex items-center px-6 lg:hidden shrink-0 bg-card">
            <SidebarTrigger />
            <span className="ml-4 font-display font-bold text-lg text-primary">FSM.IO</span>
          </header>
          <div className="flex-1 overflow-auto bg-muted/30">
            {children}
          </div>
        </main>
      </div>
      <div className="print-only text-black bg-white w-full hidden">
        {children}
      </div>
    </SidebarProvider>
  );
}
