import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, BookOpen, Layers3, Users } from "lucide-react";

import { AuthButtons } from "@/components/auth/auth-buttons";
import { StudySpaceLogo } from "@/components/brand/studyspace-logo";
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

    const dashboardData = await getDashboardData(user);

    return (
      <ProjectDashboard
        memberships={dashboardData.memberships}
        profile={dashboardData.profile}
        workspaces={dashboardData.workspaces}
      />
    );
  }

  return (
    <main className="grid min-h-dvh grid-cols-[44%_56%] bg-white">
      <section className="flex min-h-dvh flex-col px-14 py-10 xl:px-20 xl:py-14 [@media(max-height:760px)]:px-12 [@media(max-height:760px)]:py-7">
        <StudySpaceLogo
          iconClassName="bg-[#5b4fc4] text-white shadow-[0_8px_20px_rgba(91,79,196,0.24)]"
        />

        <div className="my-auto max-w-xl py-8 [@media(max-height:760px)]:py-5">
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-normal [@media(max-height:760px)]:text-4xl">
            Track every contribution,{" "}
            <span className="text-[#5b4fc4]">together.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground [@media(max-height:760px)]:mt-3">
            Shared work, visible effort, and fair credit for every academic
            team.
          </p>

          <div className="mt-8 space-y-3 [@media(max-height:760px)]:mt-5 [@media(max-height:760px)]:space-y-2">
            <Feature
              icon={<Layers3 aria-hidden="true" />}
              text="Create weighted tasks and keep responsibilities clear."
              title="Track Contributions"
            />
            <Feature
              icon={<Users aria-hidden="true" />}
              text="Claim work, submit results, and verify progress as a team."
              title="Team Collaboration"
            />
            <Feature
              icon={<BarChart3 aria-hidden="true" />}
              text="Turn verified work into a lecturer-readable report."
              title="Proof of Contribution"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Weighted tasks, peer verification, and clear contribution records.
        </p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#5b4fc4] px-12 py-10">
        <div className="absolute -left-28 top-[34%] size-72 rounded-full border border-white/10" />
        <div className="absolute -left-20 top-[39%] size-56 rounded-full border border-white/10" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/10" />

        <div className="relative w-full max-w-lg rounded-lg bg-white px-12 py-12 text-center shadow-[0_24px_60px_rgba(30,18,92,0.28)] [@media(max-height:760px)]:max-w-md [@media(max-height:760px)]:px-10 [@media(max-height:760px)]:py-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-[#5b4fc4] text-white shadow-[0_8px_20px_rgba(91,79,196,0.24)]">
            <BookOpen aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-5 text-xl font-semibold">StudySpace</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contribution ledger
          </p>

          <h2 className="mt-8 text-2xl font-semibold [@media(max-height:760px)]:mt-6">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your workspace.
          </p>

          <div className="mt-7">
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
    <div className="flex max-w-lg items-center gap-4 rounded-lg border border-black/8 bg-white px-4 py-3.5 shadow-sm [@media(max-height:760px)]:py-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0eefb] text-[#5b4fc4] [&>svg]:size-5">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {text}
        </span>
      </span>
    </div>
  );
}
