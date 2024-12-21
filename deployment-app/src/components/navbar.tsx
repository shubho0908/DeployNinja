"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ui/theme-toggle";
import { Button } from "./ui/button";
import { Github, Settings, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <motion.nav
      className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          DeployNinja
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {pathname !== "/login" &&
            (session ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                    <Image
                      src={session.user?.image!}
                      alt={session.user?.name!}
                      width={40}
                      height={40}
                      className="rounded-full h-8 w-8"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit relative top-3" align="center" asChild>
                  <div className="p-2">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start"
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
            ))}
        </div>
      </div>
    </motion.nav>
  );
}
