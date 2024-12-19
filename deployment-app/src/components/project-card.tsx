"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  ExternalLink,
  GitBranch,
  Users,
  Clock,
  Activity,
  BarChart,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@/types/models/Project.model";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {project.name}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {project.framework}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Ready
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last deployed
                </div>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(project?.createdAt!))} ago
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Analytics
              </div>
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                <span className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Visits
                </span>
                <span className="font-medium">1,255,622</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button className="flex-1" variant="outline" size="sm">
                <GitBranch className="w-4 h-4 mr-2" />
                Production
              </Button>
              <Button className="flex-1" size="sm" asChild>
                <a
                  href={project.subDomain}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Site
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
