"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Fish, LayoutDashboard, History, Images, Settings, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/history", icon: History, label: "History" },
  { href: "/pictures", icon: Images, label: "Pictures" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen font-body">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Fish className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">AquaGuard</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'light' ? 'Night Mode' : 'Light Mode'}>
                  {theme === 'light' ? <Moon /> : <Sun />}
                  <span>{theme === 'light' ? 'Night Mode' : 'Light Mode'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="bg-card/80 backdrop-blur-sm border-b p-2 sticky top-0 z-10 flex items-center justify-between md:justify-end">
             <div className="md:hidden">
                <SidebarTrigger />
             </div>
            <h1 className="text-lg font-bold text-foreground md:hidden">
              AquaGuard
            </h1>
            <div/>
          </header>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
