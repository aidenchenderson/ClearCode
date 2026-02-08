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
    <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <div className="p-2 rounded-lg bg-muted">
              <GraduationCap className="h-5 w-5 text-foreground" />
            </div>
            <span className="font-bold text-foreground">EduTransparency</span>
          </Link>
          <div className="ml-2">
            <Breadcrumbs />
          </div>
        </div>
        {isAuthenticated && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-all duration-300">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.picture ?? undefined} alt={user.name ?? "Profile"} />
                  <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                    {initials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-border">
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
              <DropdownMenuItem onClick={() => logout()} className="gap-2 focus:bg-muted">
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
