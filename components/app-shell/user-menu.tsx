"use client";

import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import type { ShellUser } from "@/components/app-shell/types";

export function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-6 w-6">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {user.name}
          </span>
          {user.login && (
            <span className="block truncate font-mono text-2xs text-muted-foreground">
              @{user.login}
            </span>
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block truncate text-2xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v)}
        >
          <DropdownMenuRadioItem value="light" className="gap-2 text-sm">
            <Sun className="h-3.5 w-3.5" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="gap-2 text-sm">
            <Moon className="h-3.5 w-3.5" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="gap-2 text-sm">
            <Monitor className="h-3.5 w-3.5" /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="gap-2 text-sm">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
