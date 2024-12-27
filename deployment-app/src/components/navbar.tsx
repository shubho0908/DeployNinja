"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ui/theme-toggle";
import { Button } from "./ui/button";
import { Github, LogOut, Rocket, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <motion.nav
      className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between bg-white/40 dark:bg-zinc-950/40 backdrop:blur-lg">
        <div className="flex items-start">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            DeployNinja
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {pathname !== "/login" && (
            <>
              {isLoading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : session ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 rounded-full p-0"
                      aria-label="User menu"
                    >
                      <Image
                        src={session.user?.image ?? "/default-avatar.png"}
                        alt={session.user?.name ?? "User avatar"}
                        width={40}
                        height={40}
                        className="rounded-full h-8 w-8"
                        priority
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-4 relative top-3"
                    align="end"
                    sideOffset={5}
                  >
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-4">
                        <Image
                          src={session.user?.image ?? "/default-avatar.png"}
                          alt={session.user?.name ?? "User avatar"}
                          width={48}
                          height={48}
                          className="rounded-full"
                          priority
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {session.user?.name ?? "User"}
                          </span>
                          <Link
                            href={`https://github.com/${session?.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            @{session?.username}
                          </Link>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <Button
                          variant="destructive"
                          className="w-full justify-start text-white"
                          onClick={() => signOut()}
                        >
                          <LogOut className="mr-2 h-4 w-4 text-white" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button asChild>
                  <Link href="/login">
                    <Github className="mr-2 h-4 w-4" />
                    Login with GitHub
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
