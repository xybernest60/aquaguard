
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
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
import { Fish, LayoutDashboard, Menu, Moon, Sun, FileText, UserCircle, Wifi, WifiOff } from "lucide-react";
import { auth, db } from "@/lib/firebase";

type Theme = "light" | "dark";
type DeviceStatus = "connecting" | "online" | "offline";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/reports", icon: FileText, label: "Reports" },
];

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
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<DeviceStatus>("connecting");

  useEffect(() => {
    // --- Auth Listener ---
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setLoading(false);
      } else {
        router.replace("/login");
      }
    });

    // --- Theme ---
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    // --- Heartbeat Listener ---
    let heartbeatTimeout: NodeJS.Timeout;
    const heartbeatRef = ref(db, 'heartbeat/aquaguard_main');
    
    // Set an initial timeout to declare the system offline if no data is received.
    const initialTimeout = setTimeout(() => {
        // Only set to offline if it's still in the 'connecting' state
        setSystemStatus((currentStatus) => 
            currentStatus === "connecting" ? "offline" : currentStatus
        );
        console.log("System appears offline. No initial heartbeat received in 10s.");
    }, 10000);

    const unsubscribeHeartbeat = onValue(heartbeatRef, (snapshot) => {
      // Once data is received for the first time, clear the initial timeout.
      clearTimeout(initialTimeout);
      
      if (snapshot.exists()) {
        setSystemStatus("online");
        // Reset the subsequent timeout whenever new data arrives
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = setTimeout(() => {
          setSystemStatus("offline");
          console.log("System appears offline. No heartbeat in 10s.");
        }, 10000); // 10-second threshold
      } else {
        // if no data exists at all, it's offline (after initial check)
        setSystemStatus("offline");
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeHeartbeat();
      clearTimeout(initialTimeout);
      clearTimeout(heartbeatTimeout);
    };
  }, [router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const getStatusContent = () => {
    switch (systemStatus) {
      case 'online':
        return {
          icon: <Wifi className="h-5 w-5" />,
          text: 'Online',
          color: 'text-green-500'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-5 w-5" />,
          text: 'Offline',
          color: 'text-destructive'
        };
      case 'connecting':
      default:
        return {
          icon: <Wifi className="h-5 w-5 animate-pulse" />,
          text: 'Connecting...',
          color: 'text-muted-foreground'
        };
    }
  };
  
  const statusContent = getStatusContent();

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
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto">
            <div className={`flex items-center gap-2 text-sm font-medium ${statusContent.color}`}>
                {statusContent.icon}
                <span className="hidden sm:inline">
                    System: {statusContent.text}
                </span>
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
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
