"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { displayName, statusLabel } from "@/lib/format";
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

const TASK_TITLE_MAX_LENGTH = 160;
const TASK_DESCRIPTION_MAX_LENGTH = 1000;
const TASK_CATEGORY_MAX_LENGTH = 80;

const statusTone: Record<TaskStatus, string> = {
  open: "bg-stone-100 text-stone-700",
  claimed: "bg-amber-100 text-amber-700",
  pending_approval: "bg-violet-100 text-violet-700",
  rejected: "bg-rose-100 text-rose-700",
  verified: "bg-emerald-100 text-emerald-700",
  dropped: "bg-stone-200 text-stone-700",
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
  const [formError, setFormError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [claimTask, setClaimTask] = useState<Task | null>(null);
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
    rejected: tasks.filter((task) => task.status === "rejected").length,
    verified: tasks.filter((task) => task.status === "verified").length,
    totalWeight: tasks
      .filter((task) => task.status === "verified")
      .reduce((sum, task) => sum + task.weight, 0),
  };

  function openCreateModal() {
    setModalTask(null);
    setForm(emptyForm);
    setError(null);
    setFormError(null);
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
    setFormError(null);
    setIsModalOpen(true);
  }

  function updateFormField(
    field: keyof TaskFormState,
    value: TaskFormState[keyof TaskFormState],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setBusyAction(label);
    setError(null);

    try {
      await action();
      router.refresh();
      return true;
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Something went wrong.",
      );
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function saveTask() {
    const weight = Number(form.weight);
    const title = form.title.trim();
    const category = form.category.trim() || "General";

    setFormError(null);

    if (title.length < 2) {
      setFormError("Enter a task title with at least 2 characters.");
      return;
    }

    if (title.length > TASK_TITLE_MAX_LENGTH) {
      setFormError(
        `Keep the task title within ${TASK_TITLE_MAX_LENGTH} characters.`,
      );
      return;
    }

    if (category.length < 2) {
      setFormError("Enter a category with at least 2 characters.");
      return;
    }

    if (category.length > TASK_CATEGORY_MAX_LENGTH) {
      setFormError(
        `Keep the category within ${TASK_CATEGORY_MAX_LENGTH} characters.`,
      );
      return;
    }

    if (form.description.trim().length > TASK_DESCRIPTION_MAX_LENGTH) {
      setFormError(
        `Keep the description within ${TASK_DESCRIPTION_MAX_LENGTH} characters.`,
      );
      return;
    }

    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      setFormError("Weight must be a whole number from 1 to 100.");
      return;
    }

    setBusyAction("save-task");

    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        category,
        description: form.description.trim() || null,
        title,
        weight,
      };

      const { error: saveError } = modalTask
        ? await supabase.from("tasks").update(payload).eq("id", modalTask.id)
        : await supabase.from("tasks").insert({
            ...payload,
            created_by: currentUserId,
            workspace_id: workspaceId,
          });

      if (saveError) {
        setFormError(getTaskSaveErrorMessage(saveError.message));
        return;
      }

      setIsModalOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not save this task. Please try again.");
    } finally {
      setBusyAction(null);
    }
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
    return runAction(`${action}-${taskId}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: rpcError } = await supabase.rpc(action, {
        p_task_id: taskId,
        ...args,
      });
      if (rpcError) throw new Error(rpcError.message);
    });
  }

  async function confirmClaim() {
    if (!claimTask) return;
    const succeeded = await rpcTask("claim_task", claimTask.id);
    if (succeeded) setClaimTask(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Task Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weighted bounties move from open to verified through peer consensus.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 sm:w-64"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bounties..."
              value={query}
            />
          </label>
          {canEdit ? (
            <Button className="w-full sm:w-auto" onClick={openCreateModal}>
              <Plus aria-hidden="true" />
              New Bounty
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <StatCard label="Open Bounties" value={stats.open} />
        <StatCard label="Pending Approval" value={stats.pending} />
        <StatCard label="Rejected" value={stats.rejected} />
        <StatCard label="Verified Tasks" value={stats.verified} />
        <StatCard label="Verified Weight" value={stats.totalWeight} accent />
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <p className="font-medium">Task Ledger ({tasks.length} Total)</p>
        </div>

        {tasks.length === 0 ? (
          <EmptyTasks canEdit={canEdit} onCreate={openCreateModal} />
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(220px,1.55fr)_minmax(120px,.8fr)_135px_75px_minmax(170px,1fr)] border-b bg-secondary/40 px-5 py-3 text-xs font-medium text-muted-foreground lg:grid">
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
              const assignee = task.claimed_by
                ? memberById.get(task.claimed_by)
                : null;
              const assigneeName = assignee
                ? displayName(assignee.profiles)
                : "Unassigned";

              return (
                <div
                  className="grid grid-cols-2 gap-4 border-b px-4 py-4 last:border-b-0 sm:px-5 lg:grid-cols-[minmax(220px,1.55fr)_minmax(120px,.8fr)_135px_75px_minmax(170px,1fr)] lg:items-center lg:gap-0"
                  key={task.id}
                >
                  <div className="col-span-2 min-w-0 lg:col-span-1 lg:pr-5">
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        className="min-w-0 text-left font-medium hover:underline"
                        onClick={() => setDetailTask(task)}
                        title="Open task details"
                        type="button"
                      >
                        <span className="block truncate">{task.title}</span>
                      </button>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {task.category}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 break-all text-sm text-muted-foreground">
                      {task.description || "No description provided."}
                    </p>
                    {task.status === "pending_approval" ||
                    task.status === "rejected" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {approvals}/{approvalsNeeded} approvals -{" "}
                        {taskVotes.length}/{eligibleVoters} votes cast
                      </p>
                    ) : null}
                  </div>
                  <div className="min-w-0 text-sm lg:pr-3">
                    <span className="mb-1 block text-xs text-muted-foreground lg:hidden">
                      Assignee
                    </span>
                    <div className="flex min-w-0 items-center gap-2">
                      {assignee ? (
                        <UserAvatar
                          className="size-7"
                          profile={assignee.profiles}
                        />
                      ) : null}
                      <span className="truncate">{assigneeName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground lg:hidden">
                      Status
                    </span>
                    <span
                      className={cn(
                        "block w-fit rounded-full px-3 py-1 text-xs font-medium",
                        statusTone[task.status],
                      )}
                    >
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground lg:hidden">
                      Weight
                    </span>
                    <span className="font-medium text-primary">
                      {task.weight} pts
                    </span>
                  </div>
                  <div className="col-span-2 flex min-w-0 flex-wrap gap-2 lg:col-span-1">
                    <span className="w-full text-xs text-muted-foreground lg:hidden">
                      Actions
                    </span>
                    <TaskActions
                      busyAction={busyAction}
                      canEdit={canEdit}
                      currentUserId={currentUserId}
                      hasCurrentUserVoted={hasCurrentUserVoted}
                      onDelete={() => deleteTask(task)}
                      onDrop={() => rpcTask("drop_failed_task", task.id)}
                      onEdit={() => openEditModal(task)}
                      onClaim={() => setClaimTask(task)}
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
          <div className="w-full max-w-lg rounded-lg border bg-white p-5 shadow-xl sm:p-6">
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
                  maxLength={TASK_TITLE_MAX_LENGTH}
                  onChange={(event) =>
                    updateFormField("title", event.target.value)
                  }
                  value={form.title}
                />
                <span className="block text-right text-xs text-muted-foreground">
                  {form.title.length}/{TASK_TITLE_MAX_LENGTH}
                </span>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="min-h-24 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  maxLength={TASK_DESCRIPTION_MAX_LENGTH}
                  onChange={(event) =>
                    updateFormField("description", event.target.value)
                  }
                  value={form.description}
                />
                <span className="block text-right text-xs text-muted-foreground">
                  {form.description.length}/{TASK_DESCRIPTION_MAX_LENGTH}
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Category</span>
                  <input
                    className="h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    maxLength={TASK_CATEGORY_MAX_LENGTH}
                    onChange={(event) =>
                      updateFormField("category", event.target.value)
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
                      updateFormField("weight", event.target.value)
                    }
                    type="number"
                    value={form.weight}
                  />
                </label>
              </div>
              {formError ? (
                <div
                  aria-live="polite"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={busyAction === "save-task"}
                onClick={() => {
                  setFormError(null);
                  setIsModalOpen(false);
                }}
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

      {claimTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-xl font-semibold tracking-normal">
              Claim this bounty?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You are claiming <strong>{claimTask.title}</strong>. Its details
              will lock until the task completes or is rejected and reopened.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={busyAction === `claim_task-${claimTask.id}`}
                onClick={() => setClaimTask(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={busyAction === `claim_task-${claimTask.id}`}
                onClick={confirmClaim}
              >
                {busyAction === `claim_task-${claimTask.id}` ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Clock />
                )}
                Claim bounty
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {detailTask ? (
        <TaskDetailModal
          members={members}
          onClose={() => setDetailTask(null)}
          task={detailTask}
          votes={votesByTask.get(detailTask.id) ?? []}
        />
      ) : null}
    </div>
  );
}

function getTaskSaveErrorMessage(message: string) {
  if (message.includes("tasks_title_check")) {
    return "Task titles must be between 2 and 160 characters.";
  }

  if (message.includes("tasks_category_check")) {
    return "Categories must be between 2 and 80 characters.";
  }

  if (message.includes("tasks_weight_check")) {
    return "Weight must be a whole number from 1 to 100.";
  }

  if (message.includes("tasks_description_check")) {
    return "Task descriptions must be 1,000 characters or fewer.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return "You do not have permission to create or edit tasks in this workspace.";
  }

  return "Some task details are invalid. Review the fields and try again.";
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
    <div className="rounded-lg border bg-white p-4 sm:p-5">
      <p className={cn("text-2xl font-semibold sm:text-3xl", accent && "text-primary")}>
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
  onClaim,
  onDelete,
  onDrop,
  onEdit,
  onReopen,
  onRpc,
  task,
}: {
  busyAction: string | null;
  canEdit: boolean;
  currentUserId: string;
  hasCurrentUserVoted: boolean;
  onClaim: () => void;
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
        <Button size="sm" onClick={onClaim}>
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
      <>
        <Button size="sm" onClick={() => onRpc("submit_task_for_approval")}>
          <Check aria-hidden="true" />
          Submit
        </Button>
      </>
    );
  }

  if (task.status === "pending_approval") {
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

    return (
      <span className="text-sm text-muted-foreground">Waiting votes</span>
    );
  }

  if (task.status === "rejected") {
    if (canEdit) {
      return (
        <>
          <Button size="sm" variant="outline" onClick={onReopen}>
            <RotateCcw aria-hidden="true" />
            Reopen
          </Button>
          <Button size="sm" variant="outline" onClick={onDrop}>
            <X aria-hidden="true" />
            Close
          </Button>
        </>
      );
    }

    return (
      <span className="flex items-center gap-2 text-sm text-rose-700">
        <AlertTriangle aria-hidden="true" className="size-4" />
        Awaiting decision
      </span>
    );
  }

  return <span className="text-sm text-muted-foreground">No action</span>;
}

function TaskDetailModal({
  members,
  onClose,
  task,
  votes,
}: {
  members: WorkspaceMember[];
  onClose: () => void;
  task: Task;
  votes: TaskVote[];
}) {
  const claimant = members.find((member) => member.user_id === task.claimed_by);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border bg-white p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {task.category}
            </span>
            <h2 className="mt-1 break-words text-xl font-semibold tracking-normal">
              {task.title}
            </h2>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
              statusTone[task.status],
            )}
          >
            {statusLabel(task.status)}
          </span>
        </div>

        <div className="mt-5 grid gap-4 rounded-md border bg-secondary/30 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Assignee</p>
            <div className="mt-2 flex items-center gap-2 font-medium">
              {claimant ? (
                <UserAvatar className="size-7" profile={claimant.profiles} />
              ) : null}
              {claimant ? displayName(claimant.profiles) : "Unassigned"}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="mt-2 font-medium text-primary">{task.weight} pts</p>
          </div>
        </div>

        <section className="mt-5">
          <h3 className="text-sm font-medium">Description</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
            {task.description || "No description provided."}
          </p>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-medium">Peer votes</h3>
          {votes.length ? (
            <div className="mt-3 overflow-hidden rounded-md border">
              {votes.map((vote) => {
                const voter = members.find(
                  (member) => member.user_id === vote.voter_id,
                );
                const approved = vote.vote === "approve";

                return (
                  <div
                    className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
                    key={vote.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        className="size-8"
                        profile={voter?.profiles}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {displayName(voter?.profiles)}
                        </p>
                        {vote.comment ? (
                          <p className="mt-0.5 break-words text-xs text-muted-foreground">
                            {vote.comment}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        approved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {approved ? "Approved" : "Rejected"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No peer votes have been cast.
            </p>
          )}
        </section>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
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
