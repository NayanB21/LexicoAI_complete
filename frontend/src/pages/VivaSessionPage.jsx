import { Link } from 'react-router-dom';
import VivaSessionWelcome from '../components/viva-session/VivaSessionWelcome';

export default function VivaSessionPage({ vivaSession }) {
  const fileName = vivaSession?.uploadedFileName || 'Untitled Document';

  return (
    <div className="min-h-dvh bg-[#050914] text-gray-100">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-12%] h-[420px] w-[420px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[420px] rounded-full bg-fuchsia-600/15 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 md:px-6 md:py-5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-300/90">Viva Session</p>
              <h1 className="mt-1 truncate text-xl font-semibold text-white md:text-2xl">
                {fileName}
              </h1>
            </div>

            <Link
              to="/"
              className="inline-flex w-fit items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <VivaSessionWelcome />

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <p className="text-sm text-gray-300">
              Setup wizard will be added in Phase 2. Your document is ready and this page shell is now active.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
