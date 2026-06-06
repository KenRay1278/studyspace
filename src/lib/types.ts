export type WorkspaceRole = "owner" | "editor" | "member";

export type TaskStatus =
  | "open"
  | "claimed"
  | "pending_approval"
  | "verified"
  | "dropped";

export type TaskVoteValue = "approve" | "reject";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMembership = {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
};

export type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  profiles: Profile | null;
};

export type Task = {
  id: string;
  workspace_id: string;
  task_number: number;
  task_code: string;
  title: string;
  description: string | null;
  category: string;
  weight: number;
  status: TaskStatus;
  created_by: string;
  claimed_by: string | null;
  claimed_at: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  dropped_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskVote = {
  id: string;
  task_id: string;
  voter_id: string;
  vote: TaskVoteValue;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type LedgerEntry = {
  id: string;
  task_id: string;
  workspace_id: string;
  member_id: string;
  title: string;
  category: string;
  weight: number;
  verified_at: string;
  created_at: string;
};
