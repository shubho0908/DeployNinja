"use client"

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ui/theme-toggle";
import { Button } from "./ui/button";
import { Github, LogOut } from "lucide-react";
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-start">
          <Link href="/" className="text-2xl font-bold">
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
                    className="w-fit relative top-3"
                    align="end"
                    sideOffset={5}
                    asChild
                  >
                    <div className="">
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start w-full"
                        onClick={() => signOut()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
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