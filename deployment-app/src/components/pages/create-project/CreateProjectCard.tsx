import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, X, Terminal, Key, Box, GitBranch, 
  Rocket, ArrowLeft, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from "@/components/ui/select";
import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { frameworks, container, item } from "@/utils/constants";
import { useCreateProject } from "./CreateProject";

export default function CreateProjectCard() {
  const { state, updateState, handleSubmit } = useCreateProject();

  const addEnvVar = () => {
    updateState({ 
      envVars: [...state.envVars, { key: "", value: "" }] 
    });
  };

  const removeEnvVar = (index: number) => {
    updateState({
      envVars: state.envVars.filter((_, i) => i !== index)
    });
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...state.envVars];
    newEnvVars[index][field] = value;
    updateState({ envVars: newEnvVars });
  };

  const handleRepoSelect = (value: string) => {
    const repo = state.repositories.find(repo => repo.id.toString() === value);
    updateState({ selectedRepo: repo || null });
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
          {/* Header */}
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
              <Link href="/projects" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />Back to Projects
              </Link>
            </Button>
          </div>

          {/* Main Form */}
          <motion.div variants={container} initial="hidden" animate="show" 
            className="space-y-8 bg-card p-6 rounded-lg border shadow-sm">
            
            {/* Repository Selection */}
            <motion.div variants={item} className="space-y-4">
              <Label htmlFor="repo-select" className="flex items-center gap-2">
                <Box className="h-4 w-4" />Select Repository
              </Label>

              {state.error && (
                <div className="text-sm text-destructive mb-2">Error: {state.error}</div>
              )}

              {state.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading repositories...</div>
              ) : (
                <Select onValueChange={handleRepoSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id.toString()}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>

            {/* Framework Selection and Build Settings */}
            {state.selectedRepo && (
              <motion.div variants={item} className="space-y-4">
                {/* Framework Selection */}
                <Label className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />Framework
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {frameworks.map((framework) => (
                    <Button
                      key={framework.id}
                      type="button"
                      variant={state.selectedFramework === framework.name ? "default" : "outline"}
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => updateState({ selectedFramework: framework.name })}
                    >
                      <span className="text-2xl">{framework.icon}</span>
                      <span>{framework.name}</span>
                    </Button>
                  ))}
                </div>

                {/* Build Commands */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="build-commands">
                    <AccordionTrigger className="hover:no-underline group">
                      <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Terminal className="h-4 w-4" />Build Commands
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="install-command">Install Command</Label>
                          <Input
                            id="install-command"
                            placeholder="npm install"
                            value={state.installCommand}
                            onChange={e => updateState({ installCommand: e.target.value })}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="build-command">Build Command</Label>
                          <Input
                            id="build-command"
                            placeholder="npm run build"
                            value={state.buildCommand}
                            onChange={e => updateState({ buildCommand: e.target.value })}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rootDir">Root Directory</Label>
                          <Input
                            id="rootDir"
                            placeholder="./"
                            value={state.projectRootDir}
                            onChange={e => updateState({ projectRootDir: e.target.value })}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Environment Variables */}
                  <AccordionItem value="env-vars">
                    <AccordionTrigger className="hover:no-underline group">
                      <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Key className="h-4 w-4" />Environment Variables
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {state.envVars.map((envVar, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2"
                          >
                            <Input
                              placeholder="KEY"
                              value={envVar.key}
                              onChange={e => updateEnvVar(index, 'key', e.target.value)}
                              className="font-mono text-sm"
                            />
                            <Input
                              placeholder="VALUE"
                              value={envVar.value}
                              onChange={e => updateEnvVar(index, 'value', e.target.value)}
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

                {/* Submit Button */}
                {state.isSubmitting ? (
                  <Button disabled className="w-full" size="lg">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />Please wait
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" onClick={handleSubmit}>
                    <Rocket className="mr-2 h-4 w-4" />Create Project
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}