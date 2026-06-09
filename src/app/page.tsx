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

  const nextPath = join ? `/join/${join}` : "/";

  return (
    <>
      <main className="min-h-dvh overflow-hidden bg-white lg:hidden">
        <header className="flex items-center border-b border-black/10 bg-white px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#5b4fc4] text-white shadow-md">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">StudySpace</span>
              <span className="block text-xs text-muted-foreground">
                Contribution ledger
              </span>
            </span>
          </div>
        </header>

        <section className="relative min-h-[calc(100dvh-81px)] overflow-hidden bg-[#5b4fc4] px-5 pb-8 pt-10 text-white">
          <div className="pointer-events-none absolute -right-24 -top-20 size-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -left-28 bottom-[-8rem] size-64 rounded-full border border-white/10" />
          <h1 className="mx-auto max-w-sm text-center text-4xl font-semibold leading-[1.08] tracking-normal">
            Track every contribution,{" "}
            <span className="text-[#ded9ff]">together.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-center text-base leading-7 text-white/75">
            Shared work, visible effort, and fair credit for every academic
            team.
          </p>

          <div className="mx-auto mt-7 w-full max-w-sm">
            <AuthButtons nextPath={nextPath} />
          </div>

          <h2 className="mt-10 text-center text-sm font-semibold text-white/75">
            Built for accountable teamwork
          </h2>
          <LandingFeatures className="mt-4" horizontal inverted />
        </section>
      </main>

      <main className="hidden min-h-dvh bg-white lg:grid lg:grid-cols-[44%_56%]">
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

          <LandingFeatures className="mt-8 [@media(max-height:760px)]:mt-5" />
        </div>

        <p className="text-xs text-muted-foreground">
          Weighted tasks, peer verification, and clear contribution records.
        </p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#5b4fc4] px-12 py-10">
        <div className="absolute -left-28 top-[34%] size-72 rounded-full border border-white/10" />
        <div className="absolute -left-20 top-[39%] size-56 rounded-full border border-white/10" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/10" />

        <div className="relative w-full max-w-lg rounded-lg bg-white px-6 py-10 text-center shadow-[0_24px_60px_rgba(30,18,92,0.28)] sm:px-12 sm:py-12 [@media(max-height:760px)]:lg:max-w-md [@media(max-height:760px)]:lg:px-10 [@media(max-height:760px)]:lg:py-8">
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
            <AuthButtons nextPath={nextPath} />
          </div>
        </div>
      </section>
    </main>
    </>
  );
}

function LandingFeatures({
  className = "",
  horizontal = false,
  inverted = false,
}: {
  className?: string;
  horizontal?: boolean;
  inverted?: boolean;
}) {
  return (
    <div
      className={
        horizontal
          ? `grid grid-cols-3 gap-2 ${className}`
          : `space-y-3 [@media(max-height:760px)]:space-y-2 ${className}`
      }
    >
      <Feature
        compact={horizontal}
        icon={<Layers3 aria-hidden="true" />}
        inverted={inverted}
        text="Create weighted tasks and keep responsibilities clear."
        title="Track Contributions"
      />
      <Feature
        compact={horizontal}
        icon={<Users aria-hidden="true" />}
        inverted={inverted}
        text="Claim work, submit results, and verify progress as a team."
        title="Team Collaboration"
      />
      <Feature
        compact={horizontal}
        icon={<BarChart3 aria-hidden="true" />}
        inverted={inverted}
        text="Turn verified work into a lecturer-readable report."
        title="Proof of Contribution"
      />
    </div>
  );
}

function Feature({
  compact = false,
  icon,
  inverted = false,
  text,
  title,
}: {
  compact?: boolean;
  icon: ReactNode;
  inverted?: boolean;
  text: string;
  title: string;
}) {
  return (
    <div
      className={
        compact && inverted
          ? "flex min-w-0 flex-col items-center rounded-lg border border-white/15 bg-white/10 px-2 py-4 text-center shadow-sm backdrop-blur-sm"
          : inverted
          ? "flex max-w-lg items-center gap-4 rounded-lg border border-white/15 bg-white/10 px-4 py-3.5 shadow-sm backdrop-blur-sm"
          : "flex max-w-lg items-center gap-4 rounded-lg border border-black/8 bg-white px-4 py-3.5 shadow-sm [@media(max-height:760px)]:py-2.5"
      }
    >
      <span
        className={
          inverted
            ? "flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-[#5b4fc4] [&>svg]:size-5"
            : "flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0eefb] text-[#5b4fc4] [&>svg]:size-5"
        }
      >
        {icon}
      </span>
      <span>
        <span
          className={
            compact
              ? "mt-3 block text-xs font-medium leading-4"
              : "block text-sm font-medium"
          }
        >
          {title}
        </span>
        <span
          className={
            compact
              ? "mt-1 hidden"
              : inverted
              ? "mt-0.5 block text-xs leading-5 text-white/65"
              : "mt-0.5 block text-xs leading-5 text-muted-foreground"
          }
        >
          {text}
        </span>
      </span>
    </div>
  );
}
