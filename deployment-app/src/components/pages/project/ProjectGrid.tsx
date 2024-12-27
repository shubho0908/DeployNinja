"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import BlurFade from "@/components/ui/blur-fade";
import { ProjectCard } from "@/components/pages/project/project-card";
import { useEffect, useState } from "react";
import { MdSearchOff } from "react-icons/md";

interface ProjectGridProps {
  projects: any[];
  isInitialLoading?: boolean;
}

export default function ProjectGrid({
  projects,
  isInitialLoading = true,
}: ProjectGridProps) {
  const [isLoading, setIsLoading] = useState(isInitialLoading);

  useEffect(() => {
    if (!isInitialLoading) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInitialLoading]);

  return (
    <>
      {isLoading ? (
        <>
          <div className="col-[2]">
            <motion.div
              className="flex items-center justify-center gap-2 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading projects...</p>
            </motion.div>
          </div>
        </>
      ) : !isLoading && projects.length === 0 ? (
        <div className="col-[2]">
          <motion.div
            className="flex items-center justify-center flex-col p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <MdSearchOff className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="mt-4 text-xl font-semibold text-foreground">
              Projects not found
            </p>
            <p className="text-muted-foreground">
              Create a new project to get started
            </p>
          </motion.div>
        </div>
      ) : (
        <>
          {projects.map((project, idx) => (
            <BlurFade key={project.id} delay={0.25 + idx * 0.05} inView>
              <ProjectCard key={project.id} project={project} />
            </BlurFade>
          ))}
        </>
      )}
    </>
  );
}
