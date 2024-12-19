"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ui/theme-toggle'
import { Button } from './ui/button'
import { Github } from 'lucide-react'

export function Navbar() {
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
          <Button asChild>
            <Link href="/login">
              <Github className="mr-2 h-4 w-4" />
              Login with GitHub
            </Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  )
}