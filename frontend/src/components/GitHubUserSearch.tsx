import { useState, useEffect, useRef } from "react";
import { Github, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchGitHubUsers } from "@/lib/api";
import type { GitHubUser } from "@/lib/api";

const DEBOUNCE_MS = 350;

export interface GitHubUserSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: GitHubUser) => void;
  disabled?: boolean;
  placeholder?: string;
  getAccessToken?: () => Promise<string | null>;
  /** Only run search when user has changed the input (not on mount/dialog open). */
  searchOnlyOnChange?: boolean;
}

export function GitHubUserSearch({
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = "Search GitHub username…",
  getAccessToken,
  searchOnlyOnChange = true,
}: GitHubUserSearchProps) {
  const [searchResults, setSearchResults] = useState<GitHubUser[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchedRef = useRef("");

  useEffect(() => {
    const query = value.trim();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      lastSearchedRef.current = "";
      return;
    }
    if (searchOnlyOnChange && query === lastSearchedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSearchedRef.current = query;
      setSearching(true);
      setSearchError(null);
      searchGitHubUsers(query)
        .then(({ items, error }) => {
          setSearchResults(items);
          setSearchError(error ?? null);
        })
        .catch(() => {
          setSearchResults([]);
          setSearchError("Search failed.");
        })
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, searchOnlyOnChange]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 min-h-[3.25rem]">
        <Github className="h-6 w-6 text-muted-foreground shrink-0" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 p-0 pl-2 shadow-none focus-visible:ring-0 h-auto min-h-[2rem] text-base flex-1 min-w-0"
          disabled={disabled}
          autoFocus
        />
        {(searching) && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />}
      </div>
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2 rounded-lg border bg-popover shadow-lg overflow-hidden">
          <ScrollArea className="max-h-[280px]">
            {searchResults.map((u) => (
              <button
                key={u.login}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none disabled:opacity-50 text-base"
                onClick={() => onSelect(u)}
                disabled={disabled}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar_url} alt={u.login} />
                  <AvatarFallback className="text-sm">{u.login.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">@{u.login}</span>
                  {u.name && u.name !== u.login && (
                    <span className="ml-2 text-muted-foreground text-sm">({u.name})</span>
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
      {value.trim().length >= 2 && !searching && searchResults.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {searchError ?? "No GitHub users found. Try another search."}
        </p>
      )}
    </div>
  );
}
