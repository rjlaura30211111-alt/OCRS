import Link from "next/link";

const menuItems = [
  {
    href: "/submit",
    title: "Submit Report",
    description: "Generate QR code and export to routing slip document.",
    action: "Generate QR Code →",
  },
  {
    href: "/track",
    title: "Track My Document",
    description: "Check the status and location of your submitted document.",
    action: "Track Document →",
  },
] as const;

export function HomeLanding() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">OCRS</h1>
          <p className="mt-2 text-muted">Document Tracker</p>
        </div>

        <div className="grid gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <h2 className="text-lg font-semibold group-hover:text-primary">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
              <p className="mt-4 text-sm font-medium text-primary">
                {item.action}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
