export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Offline mode
          </p>
          <h1 className="text-4xl font-bold tracking-tight">You are offline</h1>
          <p className="text-base text-muted-foreground">
            Table Track can still open pages you have already visited. Once your
            connection is back, refresh to sync with the server again.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Retry home
          </a>
          <a
            href="/kiosk/welcome"
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Open kiosk
          </a>
        </div>
      </div>
    </main>
  );
}