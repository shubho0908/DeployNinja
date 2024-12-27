import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProjectHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Rocket className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Deploy your next big idea in minutes
          </p>
        </div>
      </div>
      <Button variant="ghost" asChild>
        <Link href="/projects" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </Button>
    </div>
  );
}