"use client";

import { motion } from "framer-motion";
import { Loader2, Rocket } from "lucide-react";
import BlurFade from "@/components/ui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { useEffect, useState } from "react";

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

  // Show nothing while initially loading
  if (isLoading) {
    return (
      <>
        <div className="col-[2] my-4">
          <motion.div
            className="flex items-center justify-center gap-2 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading projects...</p>
          </motion.div>
        </div>
      </>
    );
  }

  // Only show empty state after loading is complete
  if (!isLoading && projects.length === 0) {
    return (
      <div className="col-[2]">
        <motion.div
          className="flex items-center justify-center flex-col p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Rocket className="text-6xl text-muted-foreground mb-2" />
          <p className="text-xl mt-4 text-foreground">Create a new project</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {projects.map((project, idx) => (
        <BlurFade key={project.id} delay={0.25 + idx * 0.05} inView>
          <ProjectCard key={project.id} project={project} />
        </BlurFade>
      ))}
    </>
  );
}
