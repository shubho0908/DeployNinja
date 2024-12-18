"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import NewProjectDialog from "@/components/NewProjectDialog";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

function Dashboard() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.user);
  const { projects } = useSelector((state: RootState) => state.projects);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects of {user?.name}</h1>
          <Button
            onClick={() => setIsNewProjectOpen(true)}
            className="bg-white text-black hover:bg-white/90"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Conditionally render the projects list or a message */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.length === 0 ? (
            <div className="glass-card p-6 rounded-lg">
              <p className="text-muted-foreground text-center">
                No projects yet. Create your first project to get started.
              </p>
            </div>
          ) : (
            projects?.map((project) => (
              <div key={project.id} className="glass-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Framework:</strong> {project.framework}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Install Command:</strong> {project.installCommand}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Build Command:</strong> {project.buildCommand}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Project Root Directory:</strong> {project.projectRootDir}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Git Repo URL:</strong> <a href={project.gitRepoUrl} className="text-blue-500">{project.gitRepoUrl}</a>
                </p>

                {/* Show deployments if available */}
                {project.deployments && project.deployments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Deployments:</h4>
                    <ul className="list-disc pl-5">
                      {project.deployments.map((deployment, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          Deployment {idx + 1}: {deployment.gitCommitHash}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
      />
    </div>
  );
}

export default Dashboard;
