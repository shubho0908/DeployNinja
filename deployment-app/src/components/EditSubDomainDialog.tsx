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

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      await API.patch(`/project?projectId=${projectId}&deploymentId=${deploymentId}`, {
        newSubDomain: subdomain,
      });

      onSuccess();
      setOpen(false);
      toast.success("Subdomain updated successfully");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update subdomain");
      throw new Error(await handleApiError(err));
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
