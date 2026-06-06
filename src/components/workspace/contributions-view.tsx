import { Award, Download } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { displayName } from "@/lib/format";
import type { LedgerEntry, WorkspaceMember } from "@/lib/types";

type ContributionsViewProps = {
  ledger: LedgerEntry[];
  members: WorkspaceMember[];
  workspaceId: string;
};

export function ContributionsView({
  ledger,
  members,
  workspaceId,
}: ContributionsViewProps) {
  const totalWeight = ledger.reduce((sum, entry) => sum + entry.weight, 0);
  const totalsByMember = new Map<string, number>();
  const totalsByCategory = new Map<string, number>();

  ledger.forEach((entry) => {
    totalsByMember.set(
      entry.member_id,
      (totalsByMember.get(entry.member_id) ?? 0) + entry.weight,
    );
    totalsByCategory.set(
      entry.category,
      (totalsByCategory.get(entry.category) ?? 0) + entry.weight,
    );
  });

  const topMember = members
    .map((member) => ({
      member,
      total: totalsByMember.get(member.user_id) ?? 0,
    }))
    .sort((a, b) => b.total - a.total)[0];
  const average = members.length ? totalWeight / members.length : 0;
  const fairness = calculateFairness(
    members.map((member) => totalsByMember.get(member.user_id) ?? 0),
  );

  return (
    <div className="mx-auto w-full max-w-[1680px] px-8 py-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Contributions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified work only. Pending or claimed tasks do not affect totals.
          </p>
        </div>
        <Button asChild>
          <Link href={`/workspaces/${workspaceId}/proof-of-work`}>
            <Download aria-hidden="true" />
            Export PDF
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <SummaryCard
          label="Top contributor"
          value={topMember ? displayName(topMember.member.profiles) : "-"}
          detail={topMember ? `${topMember.total} pts earned` : "No verified work"}
        />
        <SummaryCard
          label="Total weight earned"
          value={String(totalWeight)}
          detail={`${ledger.length} verified tasks`}
        />
        <SummaryCard
          label="Avg per member"
          value={average.toFixed(1)}
          detail="pts per person"
        />
        <SummaryCard
          label="Fairness score"
          value={`${fairness}%`}
          detail="distribution index"
        />
      </div>

      {ledger.length === 0 ? (
        <EmptyContributions />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-[1fr_1fr] gap-4">
            <section className="rounded-lg border bg-white p-5">
              <h2 className="font-medium">Member breakdown</h2>
              <div className="mt-5 space-y-5">
                {members.map((member) => {
                  const total = totalsByMember.get(member.user_id) ?? 0;
                  const percentage = totalWeight
                    ? Math.round((total / totalWeight) * 100)
                    : 0;
                  const name = displayName(member.profiles);

                  return (
                    <div key={member.user_id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            className="size-8"
                            profile={member.profiles}
                          />
                          <span className="font-medium">{name}</span>
                        </div>
                        <span className="text-primary">
                          {total} pts · {percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5">
              <h2 className="font-medium">Task weight by category</h2>
              <div className="mt-5 space-y-5">
                {[...totalsByCategory.entries()].map(([category, total]) => {
                  const percentage = totalWeight
                    ? Math.round((total / totalWeight) * 100)
                    : 0;

                  return (
                    <div key={category}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-primary">
                          {total} pts · {percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="mt-6 overflow-x-auto rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-medium">Verified task ledger</h2>
              <span className="text-xs text-muted-foreground">
                Immutable - append only
              </span>
            </div>
            <div className="grid min-w-[900px] grid-cols-[1fr_180px_140px_110px] border-b bg-secondary/40 px-5 py-3 text-xs font-medium text-muted-foreground">
              <span>Task</span>
              <span>Member</span>
              <span>Category</span>
              <span>Weight</span>
            </div>
            {ledger.map((entry) => {
              const member = members.find(
                (candidate) => candidate.user_id === entry.member_id,
              );

              return (
                <div
                  className="grid min-w-[900px] grid-cols-[1fr_180px_140px_110px] border-b px-5 py-4 text-sm last:border-b-0"
                  key={entry.id}
                >
                  <span className="font-medium">{entry.title}</span>
                  <span>{displayName(member?.profiles)}</span>
                  <span>{entry.category}</span>
                  <span className="font-medium text-primary">
                    {entry.weight} pts
                  </span>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold tracking-normal">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyContributions() {
  return (
    <div className="mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 text-center">
      <Award aria-hidden="true" className="size-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold tracking-normal">
        No verified contribution yet
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Contribution analytics will appear after tasks pass peer consensus and
        enter the verified ledger.
      </p>
    </div>
  );
}

function calculateFairness(values: number[]) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;

  const average = total / values.length;
  const meanAbsoluteDeviation =
    values.reduce((sum, value) => sum + Math.abs(value - average), 0) /
    values.length;
  const score = Math.max(0, 100 - Math.round((meanAbsoluteDeviation / average) * 100));

  return score;
}
