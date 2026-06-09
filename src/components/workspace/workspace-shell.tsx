import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList, FileText, Folder, Users } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { StudySpaceLogo } from "@/components/brand/studyspace-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { InviteCodeButton } from "@/components/workspace/invite-code-button";
import { MemberManagement } from "@/components/workspace/member-management";
import { WorkspaceSettings } from "@/components/workspace/workspace-settings";
import { displayName, roleLabel } from "@/lib/format";
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
            <StudySpaceLogo />
          </Link>

          <div className="border-b px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Workspace
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dcd7f5] bg-[#f7f6fd] px-3 py-2 text-sm font-medium">
              <Folder aria-hidden="true" className="size-4 text-[#5b4fc4]" />
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
                    isActive && "bg-primary text-primary-foreground",
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
            <UserAvatar className="size-9" profile={profile} />
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
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Invite code:</span>
                <InviteCodeButton code={workspace.invite_code} />
              </div>
              <MemberManagement
                currentUserId={currentUserId}
                currentUserRole={role}
                members={members}
                workspace={workspace}
              />
              <WorkspaceSettings
                currentUserRole={role}
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
