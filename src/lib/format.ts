import type { Profile, TaskStatus, WorkspaceRole } from "@/lib/types";

export function displayName(profile?: Profile | null) {
  return profile?.full_name?.trim() || "Unnamed user";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function roleLabel(role: WorkspaceRole) {
  return role[0].toUpperCase() + role.slice(1);
}

export function statusLabel(status: TaskStatus) {
  return status
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
