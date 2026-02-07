import { Link } from "react-router-dom";
import { GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "./Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";

function initials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) return email.slice(0, 2).toUpperCase();
  return "?";
}

const TopBar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-white/30 bg-white/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/30">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100/60 to-purple-100/60 backdrop-blur-md">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">EduTransparency</span>
          </Link>
          <div className="ml-2">
            <Breadcrumbs />
          </div>
        </div>
        {isAuthenticated && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50 transition-all duration-300">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.picture ?? undefined} alt={user.name ?? "Profile"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100/60 to-purple-100/60 text-primary text-xs font-medium">
                    {initials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-white/40">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  {user.name && (
                    <span className="font-medium text-foreground">{user.name}</span>
                  )}
                  {user.email && (
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  )}
                  {!user.name && !user.email && (
                    <span className="text-xs text-muted-foreground">Signed in</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="gap-2 focus:bg-blue-50/50">
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default TopBar;
