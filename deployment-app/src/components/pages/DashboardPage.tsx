"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ProjectCard } from "@/components/project-card";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.user);
  const { projects } = useSelector((state: RootState) => state.projects);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl relative top-16 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{user?.name}'s Projects</h1>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/dashboard/create-project">
              <Plus className="h-4 w-4" />
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
          {projects?.length === 0 ? (
            <motion.div
              className="flex items-center justify-center flex-col p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Plus className="text-6xl text-muted-foreground mb-4" />
              <p className="text-xl mt-4 text-muted-foreground">
                No projects created yet
              </p>
            </motion.div>
          ) : (
            projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
