"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import NewProjectDialog from "@/components/NewProjectDialog";

function Dashboard() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button
            onClick={() => setIsNewProjectOpen(true)}
            className="bg-white text-black hover:bg-white/90"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="glass-card p-6 rounded-lg">
            <p className="text-muted-foreground text-center">
              No projects yet. Create your first project to get started.
            </p>
          </div>
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
