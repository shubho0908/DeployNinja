"use client";

import { motion } from "framer-motion";
import { Project } from "@/types/schemas/Project";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { useTheme } from "next-themes";
import { ProjectHeader } from "./ProjectCardHeader";
import { ProjectDetails } from "./ProjectCardDetails";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { getLatestDeployment } from "./ProjectCardUtils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [latestDeployment, setLatestDeployment] = useState<any>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLatestDeployment(getLatestDeployment(project?.deployments!));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [project.deployments]);

  const handleCardClick = () => {
    if (!isDialogOpen && latestDeployment?.id) {
      router.push(`/deployments/${latestDeployment.id}`);
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <MagicCard
        gradientSize={180}
        gradientOpacity={0.5}
        className="cursor-pointer flex-col items-center justify-center shadow whitespace-nowrap text-4xl w-full"
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
      >
        <div
          className="space-y-0 p-4 flex justify-between w-full"
          onClick={handleCardClick}
        >
          <ProjectHeader
            project={project}
            isLoading={isLoading}
            latestDeployment={latestDeployment}
            setIsDialogOpen={setIsDialogOpen}
          />
        </div>
        <ProjectDetails
          project={project}
          isLoading={isLoading}
          latestDeployment={latestDeployment}
        />
        <DeleteProjectDialog
          project={project}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </MagicCard>
    </motion.div>
  );
}
