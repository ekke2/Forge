"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteProjectAction } from "@/lib/actions/projects";

export function DangerZone({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [working, setWorking] = useState(false);

  async function del() {
    setWorking(true);
    const res = await deleteProjectAction(projectId);
    setWorking(false);
    if (res.ok) {
      toast.success("Project deleted");
      router.push("/app");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        <p className="text-xs text-muted-foreground">
          Deleting a project removes all Forge-owned data (tasks, workflow,
          messages) and the cached GitHub mirror. Your GitHub repository is not
          affected.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Delete this project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {projectName}?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. Type{" "}
              <span className="font-mono text-foreground">{projectName}</span> to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={projectName}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirm !== projectName || working}
              onClick={del}
            >
              {working && <Loader2 className="animate-spin" />}
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
