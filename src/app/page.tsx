import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, Users } from "lucide-react";

import { AuthButtons } from "@/components/auth/auth-buttons";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";
import { getDashboardData, getSessionUser } from "@/lib/supabase/data";

type HomeProps = {
  searchParams: Promise<{
    join?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { join } = await searchParams;
  const user = await getSessionUser();

  if (user) {
    if (join) {
      redirect(`/join/${join}`);
    }

    const dashboardData = await getDashboardData(user.id);

    return (
      <ProjectDashboard
        memberships={dashboardData.memberships}
        profile={dashboardData.profile}
        workspaces={dashboardData.workspaces}
      />
    );
  }

  return (
    <main className="grid min-h-dvh grid-cols-[minmax(520px,1fr)_minmax(520px,1.05fr)] bg-[#f4f1eb]">
      <section className="flex flex-col justify-between px-16 py-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-normal">
                StudySpace
              </p>
              <p className="text-sm text-muted-foreground">
                Contribution ledger for academic teams
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <h1 className="text-5xl font-semibold tracking-normal">
              Track every contribution, together.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Create weighted task bounties, verify finished work through peer
              consensus, and export a lecturer-readable proof-of-work summary.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <Feature
              icon={<CheckCircle2 aria-hidden="true" />}
              text="Peer-approved task verification"
              title="Weighted Bounties"
            />
            <Feature
              icon={<Users aria-hidden="true" />}
              text="Clear project roles for owners, editors, and members"
              title="Group Accountability"
            />
            <Feature
              icon={<BookOpen aria-hidden="true" />}
              text="Verified ledger data ready for proof-of-work reports"
              title="Lecturer Readability"
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          GitHub contribution automation is planned after the MVP.
        </p>
      </section>

      <section className="flex items-center justify-center bg-[linear-gradient(135deg,#211062,#6f63d6)] px-12">
        <div className="w-full max-w-xl rounded-xl bg-white px-12 py-14 text-center shadow-2xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BookOpen aria-hidden="true" />
          </div>
          <h2 className="mt-7 text-2xl font-semibold tracking-normal">
            Welcome back
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your contribution ledger.
          </p>
          <div className="mt-8 flex justify-center">
            <AuthButtons nextPath={join ? `/join/${join}` : "/"} />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  text,
  title,
}: {
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="flex max-w-lg gap-4 rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
