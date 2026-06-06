export default function WorkspaceLoading() {
  return (
    <main className="min-h-dvh bg-[#efeee8]">
      <div className="flex min-h-dvh animate-pulse">
        <aside className="h-dvh w-64 shrink-0 border-r bg-white">
          <div className="border-b px-5 py-5">
            <div className="h-11 w-40 rounded-md bg-secondary" />
          </div>
          <div className="space-y-4 px-4 py-5">
            <div className="h-4 w-20 rounded bg-secondary" />
            <div className="h-10 w-full rounded-md bg-secondary" />
            <div className="mt-8 h-9 w-full rounded-md bg-secondary" />
            <div className="h-9 w-full rounded-md bg-secondary" />
            <div className="h-9 w-full rounded-md bg-secondary" />
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <div className="h-16 border-b bg-white" />
          <div className="px-8 py-7">
            <div className="h-8 w-52 rounded bg-white" />
            <div className="mt-3 h-4 w-96 rounded bg-white" />
            <div className="mt-7 grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="h-28 rounded-lg border bg-white"
                  key={index}
                />
              ))}
            </div>
            <div className="mt-6 h-[420px] rounded-lg border bg-white" />
          </div>
        </section>
      </div>
    </main>
  );
}
