import { Link, useLocation } from "react-router-dom";

function AppShell({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-wide text-white">
            NovaPrep
          </Link>
          <span className="rounded-md bg-brand-600/20 px-3 py-1 text-sm text-brand-100">
            {location.pathname}
          </span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
