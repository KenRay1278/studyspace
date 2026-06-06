"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { displayName, formatDate, initials } from "@/lib/format";
import type { LedgerEntry, Workspace, WorkspaceMember } from "@/lib/types";

type ProofOfWorkViewProps = {
  ledger: LedgerEntry[];
  members: WorkspaceMember[];
  workspace: Workspace;
};

export function ProofOfWorkView({
  ledger,
  members,
  workspace,
}: ProofOfWorkViewProps) {
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

  return (
    <div className="mx-auto w-full max-w-[1680px] px-8 py-7">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Proof of work export
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browser print can save this view as PDF.
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Download PDF
        </Button>
      </div>

      <section className="mx-auto max-w-6xl rounded-xl border-4 border-primary bg-[#f7f4ff] p-8 print:border print:bg-white print:p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-2xl font-semibold tracking-normal">
              StudySpace
            </p>
            <p className="text-sm text-muted-foreground">
              Contribution Ledger · {workspace.name}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            {ledger.length} tasks verified · immutable
          </span>
        </div>

        {ledger.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold tracking-normal">
              No verified work yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The proof-of-work receipt will fill in after tasks are approved.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <ProofCard label="Total weight earned" value={`${totalWeight} pts`} />
              <ProofCard label="Verified tasks" value={String(ledger.length)} />
              <ProofCard
                label="Active members"
                value={String(members.length)}
              />
            </div>

            <div className="mt-6 grid grid-cols-[1fr_1fr] gap-4">
              <div className="rounded-lg border bg-white p-5">
                <h2 className="font-medium">Member Breakdown</h2>
                <div className="mt-5 space-y-4">
                  {members.map((member) => {
                    const total = totalsByMember.get(member.user_id) ?? 0;
                    const percent = totalWeight
                      ? Math.round((total / totalWeight) * 100)
                      : 0;
                    const name = displayName(member.profiles);

                    return (
                      <div key={member.user_id}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="flex size-7 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-700">
                              {initials(name)}
                            </span>
                            {name}
                          </span>
                          <span>
                            {total} pts · {percent}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-5">
                <h2 className="font-medium">Task Weight by Category</h2>
                <div className="mt-5 space-y-4">
                  {[...totalsByCategory.entries()].map(([category, total]) => {
                    const percent = totalWeight
                      ? Math.round((total / totalWeight) * 100)
                      : 0;

                    return (
                      <div key={category}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span>
                            {total} pts · {percent}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
              <div className="border-b px-5 py-4">
                <h2 className="font-medium">Work Detail Receipt</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Individual task breakdown for verified work
                </p>
              </div>
              <div className="grid min-w-[1000px] grid-cols-[140px_1fr_150px_170px_100px] border-b bg-secondary/50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Verified</span>
                <span>Task</span>
                <span>Category</span>
                <span>Member</span>
                <span>Weight</span>
              </div>
              {ledger.map((entry) => {
                const member = members.find(
                  (candidate) => candidate.user_id === entry.member_id,
                );

                return (
                  <div
                    className="grid min-w-[1000px] grid-cols-[140px_1fr_150px_170px_100px] border-b px-5 py-4 text-sm last:border-b-0"
                    key={entry.id}
                  >
                    <span>{formatDate(entry.verified_at)}</span>
                    <span className="font-medium">{entry.title}</span>
                    <span>{entry.category}</span>
                    <span>{displayName(member?.profiles)}</span>
                    <span className="font-semibold text-primary">
                      {entry.weight} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ProofCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}
