export default function WorkspaceLoading() {
  return (
    <main className="min-h-dvh bg-[#efeee8]">
      <div className="flex min-h-dvh animate-pulse">
        <aside className="hidden h-dvh w-64 shrink-0 border-r bg-white lg:block">
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
          <div className="h-24 border-b bg-white lg:h-16" />
          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="h-8 w-48 rounded bg-white sm:w-52" />
            <div className="mt-3 h-4 max-w-full rounded bg-white sm:w-96" />
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="h-24 rounded-lg border bg-white lg:h-28"
                  key={index}
                />
              ))}
            </div>
            <div className="mt-6 h-[360px] rounded-lg border bg-white lg:h-[420px]" />
          </div>
        </section>
      </div>
    </main>
  );
}
