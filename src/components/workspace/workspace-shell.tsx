import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Folder,
  Settings,
  Users,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { MemberManagement } from "@/components/workspace/member-management";
import { displayName, initials, roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile, Workspace, WorkspaceMember, WorkspaceRole } from "@/lib/types";

type WorkspaceShellProps = {
  active: "tasks" | "contributions" | "proof";
  children: ReactNode;
  currentUserId: string;
  members: WorkspaceMember[];
  workspace: Workspace;
};

const navItems = [
  {
    href: "tasks",
    key: "tasks",
    label: "Task Board",
    icon: ClipboardList,
  },
  {
    href: "contributions",
    key: "contributions",
    label: "Contributions",
    icon: Users,
  },
  {
    href: "proof-of-work",
    key: "proof",
    label: "Proof-of-work",
    icon: FileText,
  },
] as const;

export function WorkspaceShell({
  active,
  children,
  currentUserId,
  members,
  workspace,
}: WorkspaceShellProps) {
  const currentMember = members.find((member) => member.user_id === currentUserId);
  const profile = currentMember?.profiles as Profile | null | undefined;
  const role = currentMember?.role ?? ("member" as WorkspaceRole);

  return (
    <main className="min-h-dvh bg-[#efeee8]">
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r bg-white">
          <Link className="flex items-center gap-3 border-b px-5 py-5" href="/">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">StudySpace</p>
              <p className="text-xs text-muted-foreground">
                Contribution ledger
              </p>
            </div>
          </Link>

          <div className="border-b px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Workspace
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-md border bg-secondary/60 px-3 py-2 text-sm font-medium">
              <Folder aria-hidden="true" className="size-4" />
              <span className="truncate">{workspace.name}</span>
            </div>
          </div>

          <nav className="space-y-1 px-3 py-5 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;

              return (
                <Link
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-secondary",
                    isActive && "bg-violet-50 text-primary",
                  )}
                  href={`/workspaces/${workspace.id}/${item.href}`}
                  key={item.key}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center gap-3 border-t px-4 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-violet-200 text-xs font-semibold text-violet-700">
              {initials(displayName(profile))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {displayName(profile)}
              </p>
              <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-8">
            <div className="text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/">
                Projects
              </Link>
              <span className="px-2 text-muted-foreground">/</span>
              <span className="font-medium">{workspace.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings aria-hidden="true" className="size-4" />
                Invite code:{" "}
                <span className="font-mono font-medium text-foreground">
                  {workspace.invite_code}
                </span>
              </div>
              <MemberManagement
                currentUserId={currentUserId}
                currentUserRole={role}
                members={members}
                workspace={workspace}
              />
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
