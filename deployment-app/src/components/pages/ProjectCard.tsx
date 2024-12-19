"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useState } from 'react'
import { Plus, X, Terminal, Key, Box, GitBranch, Rocket, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const frameworks = [
  { id: 'nextjs', name: 'Next.js', icon: '⚡' },
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'vue', name: 'Vue', icon: '💚' },
  { id: 'angular', name: 'Angular', icon: '🅰️' }
]

export default function ProjectCardPage() {
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }])
  const [selectedFramework, setSelectedFramework] = useState('nextjs')

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen p-8 bg-muted/10">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create New Project</h1>
                <p className="text-muted-foreground">Deploy your next big idea in minutes</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 bg-card p-6 rounded-lg border shadow-sm"
          >
            <motion.div variants={item} className="space-y-4">
              <Label htmlFor="project-name" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Project Name
              </Label>
              <Input 
                id="project-name" 
                placeholder="my-awesome-project"
                className="transition-all focus:scale-[1.01]" 
              />
            </motion.div>

            <motion.div variants={item} className="space-y-4">
              <Label className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Framework
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {frameworks.map((framework) => (
                  <Button
                    key={framework.id}
                    type="button"
                    variant={selectedFramework === framework.id ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedFramework(framework.id)}
                  >
                    <span className="text-2xl">{framework.icon}</span>
                    <span>{framework.name}</span>
                  </Button>
                ))}
              </div>
            </motion.div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="build-commands">
                <AccordionTrigger className="hover:no-underline group">
                  <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Terminal className="h-4 w-4" />
                    Build Commands
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="install-command">Install Command</Label>
                      <Input
                        id="install-command"
                        placeholder="npm install"
                        defaultValue="npm install"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="build-command">Build Command</Label>
                      <Input
                        id="build-command"
                        placeholder="npm run build"
                        defaultValue="npm run build"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="env-vars">
                <AccordionTrigger className="hover:no-underline group">
                  <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Key className="h-4 w-4" />
                    Environment Variables
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {envVars.map((envVar, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="KEY"
                          value={envVar.key}
                          onChange={(e) => {
                            const newEnvVars = [...envVars]
                            newEnvVars[index].key = e.target.value
                            setEnvVars(newEnvVars)
                          }}
                          className="font-mono text-sm"
                        />
                        <Input
                          placeholder="VALUE"
                          value={envVar.value}
                          onChange={(e) => {
                            const newEnvVars = [...envVars]
                            newEnvVars[index].value = e.target.value
                            setEnvVars(newEnvVars)
                          }}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEnvVar(index)}
                          className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addEnvVar}
                      className="w-full group"
                    >
                      <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
                      Add Environment Variable
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button className="w-full" size="lg">
              <Rocket className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}