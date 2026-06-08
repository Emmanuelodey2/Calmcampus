import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Safety", href: "#safety" },
  { label: "Workflow", href: "#workflow" },
  { label: "Access", href: "/dashboard" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 text-sm font-semibold text-slate-900 shadow-sm">
            CC
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">CalmCampus</p>
            <p className="text-xs text-slate-500">Pan-Atlantic University</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-slate-600 transition hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
