import { Box } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { item } from "@/utils/constants";

interface Repository {
  id: number;
  name: string;
}

interface RepositorySelectorProps {
  repositories: Repository[];
  isLoading: boolean;
  error: string | null;
  onSelect: (value: string) => void;
}

export function RepositorySelector({ 
  repositories, 
  isLoading, 
  error, 
  onSelect 
}: RepositorySelectorProps) {
  return (
    <motion.div variants={item} className="space-y-4">
      <Label className="flex items-center gap-2">
        <Box className="h-4 w-4" />
        Select Repository
      </Label>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading repositories...
        </div>
      ) : (
        <Select onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Repository" />
          </SelectTrigger>
          <SelectContent>
            {repositories.map((repo) => (
              <SelectItem key={repo.id} value={repo.id.toString()}>
                <div className="flex items-center gap-2">
                  <FaGithub className="w-5 h-5 text-foreground" />
                  {repo.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </motion.div>
  );
}