"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion } from "@/components/ui/accordion";
import { container, item } from "@/utils/constants";
import { useCreateProject } from "./CreateProject";
import { ProjectHeader } from "./ProjectHeader";
import { RepositorySelector } from "./RepositorySelector";
import { FrameworkSelector } from "./FrameworkSelector";
import { BuildSettings } from "./BuildSettings";
import { EnvVariables } from "./EnvVariables";

export default function CreateProjectCard() {
  const { state, updateState, handleSubmit } = useCreateProject();
  const [projectName, setProjectName] = useState("");

  const handleRepoSelect = (value: string) => {
    const repo = state.repositories.find((repo) => repo.id.toString() === value);
    if (repo) {
      updateState({ selectedRepo: repo });
      setProjectName(repo.name);
    }
  };

  const handleBuildSettingsUpdate = (field: string, value: string) => {
    updateState({ [field]: value });
  };

  const handleEnvVarAdd = () => {
    updateState({
      envVars: [...state.envVars, { key: "", value: "" }],
    });
  };

  const handleEnvVarRemove = (index: number) => {
    updateState({
      envVars: state.envVars.filter((_, i) => i !== index),
    });
  };

  const handleEnvVarUpdate = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newEnvVars = [...state.envVars];
    newEnvVars[index][field] = value;
    updateState({ envVars: newEnvVars });
  };

  const handleFrameworkSelect = (framework: string) => {
    updateState({ selectedFramework: framework });
  };

  return (
    <div className="min-h-screen p-8 bg-muted/10">
      <div className="max-w-2xl relative top-16 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <ProjectHeader />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 bg-card p-6 rounded-lg border shadow"
          >
            <RepositorySelector
              repositories={state.repositories}
              isLoading={state.isLoading}
              error={state.error}
              onSelect={handleRepoSelect}
            />

            {state.selectedRepo && (
              <>
                <motion.div variants={item} className="space-y-4">
                  <Label
                    htmlFor="project-name"
                    className="flex items-center gap-2"
                  >
                    <Rocket className="h-4 w-4" />
                    Project Name
                  </Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full"
                  />
                </motion.div>

                <FrameworkSelector
                  selectedFramework={state.selectedFramework}
                  onFrameworkSelect={handleFrameworkSelect}
                />

                <Accordion type="single" collapsible className="w-full">
                  <BuildSettings
                    installCommand={state.installCommand}
                    buildCommand={state.buildCommand}
                    projectRootDir={state.projectRootDir}
                    onUpdate={handleBuildSettingsUpdate}
                  />

                  <EnvVariables
                    envVars={state.envVars}
                    onAdd={handleEnvVarAdd}
                    onRemove={handleEnvVarRemove}
                    onUpdate={handleEnvVarUpdate}
                  />
                </Accordion>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubmit(projectName)}
                  disabled={state.isSubmitting}
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Please wait
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Create Project
                    </>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}