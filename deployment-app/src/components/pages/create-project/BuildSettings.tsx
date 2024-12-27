import { Terminal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

interface BuildSettingsProps {
  installCommand: string;
  buildCommand: string;
  projectRootDir: string;
  onUpdate: (field: string, value: string) => void;
}

export function BuildSettings({
  installCommand,
  buildCommand,
  projectRootDir,
  onUpdate,
}: BuildSettingsProps) {
  return (
    <AccordionItem value="build-commands">
      <AccordionTrigger className="hover:no-underline group">
        <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
          <Terminal className="h-4 w-4" />
          Build Commands
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="install-command">Install Command</Label>
            <Input
              id="install-command"
              placeholder="npm install"
              value={installCommand}
              onChange={(e) => onUpdate("installCommand", e.target.value)}
              className={`${geistMono.className} text-sm my-1`}
            />
          </div>
          <div>
            <Label htmlFor="build-command">Build Command</Label>
            <Input
              id="build-command"
              placeholder="npm run build"
              value={buildCommand}
              onChange={(e) => onUpdate("buildCommand", e.target.value)}
              className={`${geistMono.className} text-sm my-1`}
            />
          </div>
          <div>
            <Label htmlFor="root-directory">Root Directory</Label>
            <Input
              id="root-directory"
              placeholder="./"
              value={projectRootDir}
              onChange={(e) => onUpdate("projectRootDir", e.target.value)}
              className={`${geistMono.className} text-sm my-1`}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}