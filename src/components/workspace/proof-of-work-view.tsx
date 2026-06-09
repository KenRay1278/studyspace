"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { displayName, formatDate } from "@/lib/format";
import type { LedgerEntry, Workspace, WorkspaceMember } from "@/lib/types";

type ProofOfWorkViewProps = {
  generatedAt: string;
  ledger: LedgerEntry[];
  members: WorkspaceMember[];
  workspace: Workspace;
};

export function ProofOfWorkView({
  generatedAt,
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
    <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 print-template-page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Proof of work export
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The PDF export prints only the lecturer-readable receipt below.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Download PDF
        </Button>
      </div>

      <section
        className="mx-auto max-w-6xl rounded-lg border-2 border-primary bg-[#f7f4ff] p-4 sm:p-6 lg:rounded-xl lg:border-4 lg:p-8 print-template print:border print:bg-white print:p-0"
        data-print-template
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div>
            <p className="text-2xl font-semibold tracking-normal">
              StudySpace
            </p>
            <p className="text-sm text-muted-foreground">
              Contribution Ledger - {workspace.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {generatedAt ? `Generated on ${generatedAt}` : "Generated export"}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            {ledger.length} tasks verified - immutable
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border bg-white p-4 text-sm sm:grid-cols-4 print-summary">
          <SummaryItem label="Workspace" value={workspace.name} />
          <SummaryItem label="Members" value={String(members.length)} />
          <SummaryItem label="Verified tasks" value={String(ledger.length)} />
          <SummaryItem label="Verified weight" value={`${totalWeight} pts`} />
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
            <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
              <ProofCard
                label="Total weight earned"
                value={`${totalWeight} pts`}
              />
              <ProofCard label="Verified tasks" value={String(ledger.length)} />
              <ProofCard
                label="Active members"
                value={String(members.length)}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border bg-white p-5">
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
                            <UserAvatar
                              className="size-7 print:hidden"
                              profile={member.profiles}
                            />
                            {name}
                          </span>
                          <span>
                            {total} pts - {percent}%
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
              </section>

              <section className="rounded-lg border bg-white p-5">
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
                            {total} pts - {percent}%
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
              </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-lg border bg-white">
              <div className="border-b px-5 py-4">
                <h2 className="font-medium">Work Detail Receipt</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Individual task breakdown for verified work
                </p>
              </div>
              <div className="hidden grid-cols-[140px_1fr_150px_170px_100px] border-b bg-secondary/50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid print:grid">
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
                    className="grid grid-cols-2 gap-x-4 gap-y-3 border-b px-4 py-4 text-sm last:border-b-0 sm:px-5 lg:grid-cols-[140px_1fr_150px_170px_100px] lg:gap-0 print:grid-cols-[140px_1fr_150px_170px_100px] print:gap-0"
                    key={entry.id}
                  >
                    <span className="col-span-2 text-xs text-muted-foreground lg:col-span-1 lg:text-sm lg:text-foreground print:col-span-1 print:text-sm print:text-foreground">
                      {formatDate(entry.verified_at)}
                    </span>
                    <span className="col-span-2 font-medium lg:col-span-1 print:col-span-1">
                      {entry.title}
                    </span>
                    <span>
                      <span className="block text-xs text-muted-foreground lg:hidden print:hidden">
                        Category
                      </span>
                      {entry.category}
                    </span>
                    <span>
                      <span className="block text-xs text-muted-foreground lg:hidden print:hidden">
                        Member
                      </span>
                      {displayName(member?.profiles)}
                    </span>
                    <span className="col-span-2 font-semibold text-primary lg:col-span-1 print:col-span-1">
                      {entry.weight} pts
                    </span>
                  </div>
                );
              })}
            </section>
          </>
        )}

        <div className="mt-6 flex flex-col gap-1 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Generated by StudySpace</span>
          <span>Verified ledger data only</span>
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-semibold">{value}</p>
    </div>
  );
}

function ProofCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">{value}</p>
    </div>
  );
}
