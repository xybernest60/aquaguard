
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Fish, History, LayoutDashboard, Menu, Moon, Settings, Sun, FileText, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Theme = "light" | "dark";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/history", icon: History, label: "History" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const HEARTBEAT_OFFLINE_THRESHOLD = 20000; // 20 seconds

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check for user session
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    } else {
       setUserEmail(JSON.parse(user).email);
    }

    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    // Fetch initial heartbeat
    const fetchInitialHeartbeat = async () => {
      const { data } = await supabase
        .from('heartbeat')
        .select('last_seen')
        .order('last_seen', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLastHeartbeat(new Date(data.last_seen).getTime());
      }
    };
    fetchInitialHeartbeat();

    // Subscribe to heartbeat changes
    const channel = supabase
      .channel('heartbeat-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'heartbeat' }, (payload) => {
          if ((payload.new as any)?.last_seen) {
            setLastHeartbeat(new Date((payload.new as any).last_seen).getTime());
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastHeartbeat) {
        const timeSinceHeartbeat = Date.now() - lastHeartbeat;
        setIsOnline(timeSinceHeartbeat < HEARTBEAT_OFFLINE_THRESHOLD);
      } else {
        setIsOnline(false);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [lastHeartbeat]);


  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Fish className="h-6 w-6 text-primary" />
            <span className="font-bold">AquaGuard</span>
          </Link>
          {menuItems.map((item) => (
             <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold" onClick={() => setOpen(false)}>
                <Fish className="h-6 w-6 text-primary" />
                 <span className="font-bold">AquaGuard</span>
              </Link>
              {menuItems.map((item) => (
                 <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`transition-colors hover:text-foreground ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span>Device {isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="sr-only">Toggle Theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userEmail || "My Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
