import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserAvatarNameProps {
  githubUsername: string;
  avatarUrl?: string;
  name?: string;
  /** Avatar size: default 'md' (h-8 w-8), 'sm' (h-7 w-7), 'lg' (h-10 w-10). */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function UserAvatarName({ githubUsername, avatarUrl, name, size = "md", className = "" }: UserAvatarNameProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl} alt={githubUsername} />
        <AvatarFallback className="text-xs">{githubUsername.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">@{githubUsername}</span>
      {name && name !== githubUsername && (
        <span className="text-muted-foreground text-sm">({name})</span>
      )}
    </div>
  );
}
