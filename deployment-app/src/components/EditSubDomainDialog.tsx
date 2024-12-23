"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";
import { API, handleApiError } from "@/redux/api/util";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { updateProject } from "@/redux/api/projectApi";

interface EditSubdomainDialogProps {
  projectId: string;
  deploymentId: string;
  currentSubdomain: string;
  onSuccess: () => void;
}

const EditSubdomainDialog = ({
  projectId,
  deploymentId,
  currentSubdomain,
  onSuccess,
}: EditSubdomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const [subdomain, setSubdomain] = useState(currentSubdomain);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const resultAction = await dispatch(
        updateProject({
          projectId,
          deploymentId,
          newSubDomain: subdomain,
        })
      );

      // Check if the action was fulfilled or rejected
      if (updateProject.fulfilled.match(resultAction)) {
        toast.success("Subdomain updated successfully");
        onSuccess();
        setOpen(false);
      } else if (updateProject.rejected.match(resultAction)) {
        // Handle the rejected state
        const error = resultAction.payload || "Failed to update subdomain";
        setError(error);
        toast.error(error);
      }
    } catch (err) {
      // This catch block handles any unexpected errors
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit sub-domain</DialogTitle>
          <DialogDescription>
            Enter a new subdomain for your project. This will update your
            project's URL.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="your-subdomain"
                className="flex-1"
              />
              <span className="text-sm text-zinc-500">.localhost:8000</span>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !subdomain || subdomain === currentSubdomain}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubdomainDialog;
