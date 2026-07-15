import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Brain,
  Compass,
  LogOut,
  Sparkles,
  UserCog,
  BarChart3,
  BookOpen,
  Route,
  FolderKanban,
  Hash,
  Github,
  MessageSquare,
  TrendingUp,
  GitBranch,
  FileText,
  LineChart,
  LifeBuoy,
  CreditCard,
  Linkedin,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Profile Setup", url: "/profile/setup", icon: UserCog },
  { title: "Career Recommendations", url: "/career-recommendations", icon: Compass },
  { title: "Skill Analysis & Gap", url: "/skill-analysis", icon: Brain },
  { title: "Learning Roadmap", url: "/learning-roadmap", icon: BookOpen },
  { title: "Resume Analysis", url: "/resume-analysis", icon: BarChart3 },
  { title: "LinkedIn Analysis", url: "/linkedin-analysis", icon: Linkedin },
  { title: "GitHub Analysis", url: "/github-analysis", icon: Github },
  { title: "Interview Simulator", url: "/interview-simulator", icon: MessageSquare },
  { title: "Market Intelligence", url: "/market-intelligence", icon: TrendingUp },
  { title: "Career Path Graph", url: "/career-path", icon: GitBranch },
  { title: "Career Report", url: "/career-report", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

const INSIGHT_ITEMS = [
  { title: "Career Paths", url: "#career-paths", icon: Route },
  { title: "Skill Gaps", url: "#skill-gaps", icon: BarChart3 },
  { title: "Learning Roadmap", url: "#learning-roadmap", icon: BookOpen },
  { title: "Projects", url: "#projects", icon: FolderKanban },
];

function SidebarNav() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[hsl(260,84%,60%)] flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent truncate">
              Career Decode
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        className={`relative transition-all duration-200 rounded-lg hover:bg-primary/5 ${active ? "bg-primary/10 text-primary font-medium" : ""}`}
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            {!collapsed ? "Insights" : <Hash className="h-3 w-3" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {INSIGHT_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={`${location.pathname}${item.url}`} className="transition-all duration-200 rounded-lg hover:bg-primary/5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <LogoutButton collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out");
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="ml-2">Logout</span>}
    </Button>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
  userName?: string;
}

const DashboardLayout = ({ children, userName }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNav />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
            </div>
            {userName && (
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-semibold text-foreground">{userName}</span> 👋
              </p>
            )}
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-muted/30">
            <div className="max-w-5xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
