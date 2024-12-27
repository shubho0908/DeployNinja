import { GitBranch } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { item, frameworks } from "@/utils/constants";

interface FrameworkSelectorProps {
  selectedFramework: string;
  onFrameworkSelect: (framework: string) => void;
}

export function FrameworkSelector({
  selectedFramework,
  onFrameworkSelect,
}: FrameworkSelectorProps) {
  return (
    <motion.div variants={item} className="space-y-4">
      <Label className="flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Framework
      </Label>
      <div className="grid grid-cols-2 gap-4">
        {frameworks.map((framework) => (
          <Button
            key={framework.id}
            variant={
              selectedFramework === framework.name ? "default" : "outline"
            }
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => onFrameworkSelect(framework.name)}
          >
            <span className="text-2xl">{framework.icon}</span>
            <span>{framework.name}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
