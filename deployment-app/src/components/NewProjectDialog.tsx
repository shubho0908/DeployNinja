import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EnvVar {
  key: string;
  value: string;
}

const frameworks = [
  { label: "Next.js", value: "nextjs" },
  { label: "React", value: "react" },
  { label: "Vue", value: "vue" },
  { label: "Nuxt", value: "nuxt" },
  { label: "Svelte", value: "svelte" },
];

const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }]);

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: keyof EnvVar, value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogTitle></DialogTitle>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Create New Project</h2>
            <p className="text-muted-foreground">
              Deploy your Git repository in a few steps.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input placeholder="my-awesome-project" />
            </div>

            <div className="space-y-2">
              <Label>Framework</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework.value} value={framework.value}>
                      {framework.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Root Directory</Label>
              <Input placeholder="./" />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="build-settings">
                <AccordionTrigger>Build and Output Settings</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Build Command</Label>
                      <Input placeholder="npm run build" />
                    </div>
                    <div className="space-y-2">
                      <Label>Output Directory</Label>
                      <Input placeholder="dist" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="env-vars">
                <AccordionTrigger>Environment Variables</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {envVars.map((envVar, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <Input
                              placeholder="KEY"
                              value={envVar.key}
                              onChange={(e) =>
                                updateEnvVar(index, "key", e.target.value)
                              }
                            />
                            <Input
                              placeholder="VALUE"
                              value={envVar.value}
                              onChange={(e) =>
                                updateEnvVar(index, "value", e.target.value)
                              }
                            />
                          </div>
                          {envVars.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEnvVar(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEnvVar}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Variable
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-white text-black hover:bg-white/90"
            >
              Deploy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
