import { Key, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

interface EnvVar {
  key: string;
  value: string;
}

interface EnvVariablesProps {
  envVars: EnvVar[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
}

export function EnvVariables({
  envVars,
  onAdd,
  onRemove,
  onUpdate,
}: EnvVariablesProps) {
  return (
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
                onChange={(e) => onUpdate(index, "key", e.target.value)}
                className={`${geistMono.className} text-sm my-1`}
              />
              <Input
                placeholder="VALUE"
                value={envVar.value}
                onChange={(e) => onUpdate(index, "value", e.target.value)}
                className={`${geistMono.className} text-sm my-1`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="w-full group"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
            Add Environment Variable
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}