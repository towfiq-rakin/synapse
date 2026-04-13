export default function AppIndexPage() {
  return (
    <section className="rounded-xl border bg-card p-6 text-card-foreground sm:p-8">
      <h2 className="text-2xl font-semibold">Open canvas</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a note from the left explorer, or create a new markdown note from the sidebar.
      </p>

      <div className="mt-8 min-h-[66vh] rounded-xl border border-dashed bg-muted/20 p-6">
        <p className="text-sm text-muted-foreground">
          This space stays intentionally clean. Notes render in-place here once selected.
        </p>
      </div>
    </section>
  );
}
