"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Edit3,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { displayName, initials, statusLabel } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type {
  Task,
  TaskStatus,
  TaskVote,
  WorkspaceMember,
  WorkspaceRole,
} from "@/lib/types";

type TaskBoardClientProps = {
  currentUserId: string;
  members: WorkspaceMember[];
  role: WorkspaceRole;
  tasks: Task[];
  votes: TaskVote[];
  workspaceId: string;
};

type TaskFormState = {
  category: string;
  description: string;
  title: string;
  weight: string;
};

const emptyForm: TaskFormState = {
  category: "General",
  description: "",
  title: "",
  weight: "5",
};

const statusTone: Record<TaskStatus, string> = {
  open: "bg-stone-100 text-stone-700",
  claimed: "bg-amber-100 text-amber-700",
  pending_approval: "bg-violet-100 text-violet-700",
  verified: "bg-emerald-100 text-emerald-700",
  dropped: "bg-rose-100 text-rose-700",
};

export function TaskBoardClient({
  currentUserId,
  members,
  role,
  tasks,
  votes,
  workspaceId,
}: TaskBoardClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const canEdit = role === "owner" || role === "editor";

  const memberById = new Map(members.map((member) => [member.user_id, member]));
  const votesByTask = useMemo(() => {
    const map = new Map<string, TaskVote[]>();
    votes.forEach((vote) => {
      map.set(vote.task_id, [...(map.get(vote.task_id) ?? []), vote]);
    });
    return map;
  }, [votes]);

  const filteredTasks = tasks.filter((task) => {
    const lowerQuery = query.toLowerCase();
    return (
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery) ||
      task.task_code.toLowerCase().includes(lowerQuery)
    );
  });

  const stats = {
    open: tasks.filter((task) => task.status === "open").length,
    pending: tasks.filter((task) => task.status === "pending_approval").length,
    verified: tasks.filter((task) => task.status === "verified").length,
    totalWeight: tasks
      .filter((task) => task.status === "verified")
      .reduce((sum, task) => sum + task.weight, 0),
  };

  function openCreateModal() {
    setModalTask(null);
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setModalTask(task);
    setForm({
      category: task.category,
      description: task.description ?? "",
      title: task.title,
      weight: String(task.weight),
    });
    setError(null);
    setIsModalOpen(true);
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setBusyAction(label);
    setError(null);

    try {
      await action();
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Something went wrong.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function saveTask() {
    const weight = Number(form.weight);

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      setError("Weight must be a whole number from 1 to 100.");
      return;
    }

    await runAction("save-task", async () => {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        category: form.category.trim() || "General",
        description: form.description.trim() || null,
        title: form.title.trim(),
        weight,
      };

      const { error: saveError } = modalTask
        ? await supabase.from("tasks").update(payload).eq("id", modalTask.id)
        : await supabase.from("tasks").insert({
            ...payload,
            created_by: currentUserId,
            workspace_id: workspaceId,
          });

      if (saveError) throw new Error(saveError.message);

      setIsModalOpen(false);
    });
  }

  async function deleteTask(task: Task) {
    await runAction(`delete-${task.id}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);
      if (deleteError) throw new Error(deleteError.message);
    });
  }

  async function rpcTask(action: string, taskId: string, args = {}) {
    await runAction(`${action}-${taskId}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: rpcError } = await supabase.rpc(action, {
        p_task_id: taskId,
        ...args,
      });
      if (rpcError) throw new Error(rpcError.message);
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] px-8 py-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Task Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weighted bounties move from open to verified through peer consensus.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-10 w-64 rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bounties..."
              value={query}
            />
          </label>
          {canEdit ? (
            <Button onClick={openCreateModal}>
              <Plus aria-hidden="true" />
              New Bounty
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <StatCard label="Open Bounties" value={stats.open} />
        <StatCard label="Pending Approval" value={stats.pending} />
        <StatCard label="Verified Tasks" value={stats.verified} />
        <StatCard label="Verified Weight" value={stats.totalWeight} accent />
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <p className="font-medium">Task Ledger ({tasks.length} Total)</p>
        </div>

        {tasks.length === 0 ? (
          <EmptyTasks canEdit={canEdit} onCreate={openCreateModal} />
        ) : (
          <div>
            <div className="grid min-w-[1180px] grid-cols-[1fr_190px_170px_110px_280px] border-b bg-secondary/40 px-5 py-3 text-xs font-medium text-muted-foreground">
              <span>Bounty Name</span>
              <span>Assignee</span>
              <span>Status</span>
              <span>Weight</span>
              <span>Actions</span>
            </div>
            {filteredTasks.map((task) => {
              const taskVotes = votesByTask.get(task.id) ?? [];
              const eligibleVoters = Math.max(members.length - 1, 0);
              const approvalsNeeded = Math.floor(eligibleVoters / 2) + 1;
              const approvals = taskVotes.filter(
                (vote) => vote.vote === "approve",
              ).length;
              const hasCurrentUserVoted = taskVotes.some(
                (vote) => vote.voter_id === currentUserId,
              );
              const isFailed =
                task.status === "pending_approval" &&
                taskVotes.length >= eligibleVoters &&
                approvals < approvalsNeeded;
              const assignee = task.claimed_by
                ? memberById.get(task.claimed_by)
                : null;
              const assigneeName = assignee
                ? displayName(assignee.profiles)
                : "Unassigned";

              return (
                <div
                  className="grid min-w-[1180px] grid-cols-[1fr_190px_170px_110px_280px] items-center border-b px-5 py-4 last:border-b-0"
                  key={task.id}
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      #{task.task_code} - {task.category}
                      {task.description ? ` - ${task.description}` : ""}
                    </p>
                    {task.status === "pending_approval" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {approvals}/{approvalsNeeded} approvals -{" "}
                        {taskVotes.length}/{eligibleVoters} votes cast
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {assignee ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700">
                        {initials(assigneeName)}
                      </span>
                    ) : null}
                    {assigneeName}
                  </div>
                  <span
                    className={cn(
                      "w-fit rounded-full px-3 py-1 text-xs font-medium",
                      statusTone[task.status],
                    )}
                  >
                    {statusLabel(task.status)}
                  </span>
                  <span className="font-medium text-primary">
                    {task.weight} pts
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <TaskActions
                      approvalsNeeded={approvalsNeeded}
                      busyAction={busyAction}
                      canEdit={canEdit}
                      currentUserId={currentUserId}
                      hasCurrentUserVoted={hasCurrentUserVoted}
                      isFailed={isFailed}
                      onDelete={() => deleteTask(task)}
                      onDrop={() => rpcTask("drop_failed_task", task.id)}
                      onEdit={() => openEditModal(task)}
                      onReopen={() => rpcTask("reopen_failed_task", task.id)}
                      onRpc={(name, args) => rpcTask(name, task.id, args)}
                      task={task}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {modalTask ? "Edit bounty" : "Create bounty"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Task details lock once a member claims the bounty.
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Title</span>
                <input
                  className="h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  value={form.title}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="min-h-24 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  value={form.description}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Category</span>
                  <input
                    className="h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    value={form.category}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Weight</span>
                  <input
                    className="h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    min={1}
                    max={100}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        weight: event.target.value,
                      }))
                    }
                    type="number"
                    value={form.weight}
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={busyAction === "save-task"}
                onClick={() => setIsModalOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={busyAction === "save-task"} onClick={saveTask}>
                {busyAction === "save-task" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  accent,
  label,
  value,
}: {
  accent?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className={cn("text-3xl font-semibold", accent && "text-primary")}>
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TaskActions({
  busyAction,
  canEdit,
  currentUserId,
  hasCurrentUserVoted,
  isFailed,
  onDelete,
  onDrop,
  onEdit,
  onReopen,
  onRpc,
  task,
}: {
  approvalsNeeded: number;
  busyAction: string | null;
  canEdit: boolean;
  currentUserId: string;
  hasCurrentUserVoted: boolean;
  isFailed: boolean;
  onDelete: () => void;
  onDrop: () => void;
  onEdit: () => void;
  onReopen: () => void;
  onRpc: (name: string, args?: Record<string, unknown>) => void;
  task: Task;
}) {
  const isBusy = busyAction?.endsWith(task.id) ?? false;

  if (isBusy) {
    return (
      <Button size="sm" variant="outline">
        <Loader2 className="animate-spin" />
        Working
      </Button>
    );
  }

  if (task.status === "open") {
    return (
      <>
        <Button size="sm" onClick={() => onRpc("claim_task")}>
          <Clock aria-hidden="true" />
          Claim
        </Button>
        {canEdit && !task.locked_at ? (
          <>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit3 aria-hidden="true" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </>
        ) : null}
      </>
    );
  }

  if (task.status === "claimed" && task.claimed_by === currentUserId) {
    return (
      <Button size="sm" onClick={() => onRpc("submit_task_for_approval")}>
        <Check aria-hidden="true" />
        Submit
      </Button>
    );
  }

  if (task.status === "pending_approval") {
    if (isFailed && canEdit) {
      return (
        <>
          <Button size="sm" variant="outline" onClick={onReopen}>
            <RotateCcw aria-hidden="true" />
            Reopen
          </Button>
          <Button size="sm" variant="outline" onClick={onDrop}>
            <X aria-hidden="true" />
            Drop
          </Button>
        </>
      );
    }

    if (task.claimed_by !== currentUserId && !hasCurrentUserVoted) {
      return (
        <>
          <Button
            size="sm"
            onClick={() => onRpc("cast_task_vote", { p_vote: "approve" })}
          >
            <ThumbsUp aria-hidden="true" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRpc("cast_task_vote", { p_vote: "reject" })}
          >
            <ThumbsDown aria-hidden="true" />
            Reject
          </Button>
        </>
      );
    }

    return <span className="text-sm text-muted-foreground">Waiting votes</span>;
  }

  return <span className="text-sm text-muted-foreground">No action</span>;
}

function EmptyTasks({
  canEdit,
  onCreate,
}: {
  canEdit: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
      <Clock aria-hidden="true" className="size-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold tracking-normal">
        No task bounties yet
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Create weighted tasks so members can claim work and submit it for peer
        approval.
      </p>
      {canEdit ? (
        <Button className="mt-5" onClick={onCreate}>
          <Plus aria-hidden="true" />
          New Bounty
        </Button>
      ) : null}
    </div>
  );
}
