"use client"
import { Loader2 } from "lucide-react";
import { Project } from "@/types/schemas/Project";
import { useState } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { deleteProject } from "@/redux/api/projectApi";
import { handleApiError } from "@/redux/api/util";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteProjectDialogProps {
  project: Project;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeleteProjectDialog({ 
  project, 
  isOpen, 
  onOpenChange 
}: DeleteProjectDialogProps) {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProjectDeletion = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDeleting(true);
    try {
      if (project?.id) {
        await dispatch(deleteProject(project?.id));
        toast.success("Project deleted successfully");
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to delete project");
      throw new Error(await handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {project.name}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleProjectDeletion}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}