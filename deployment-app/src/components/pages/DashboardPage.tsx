"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'

const projects = [
  {
    id: 1,
    name: "E-commerce Website",
    framework: "Next.js",
    status: "deployed",
    url: "https://example.com",
    lastDeployed: "2024-02-25T10:30:00Z",
    visits: 1234
  },
  {
    id: 2,
    name: "Personal Blog",
    framework: "React",
    status: "deployed",
    url: "https://blog.example.com",
    lastDeployed: "2024-02-24T15:45:00Z",
    visits: 567
  }
]

export default function DashboardPage() {

  const {user} = useSelector((state: RootState) => state.user)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{user?.name}'s Projects</h1>
          <Button asChild>
            <Link href="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}