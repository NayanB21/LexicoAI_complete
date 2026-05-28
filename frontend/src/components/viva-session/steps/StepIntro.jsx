import { Sparkles } from 'lucide-react';

export default function StepIntro() {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-200">
        <Sparkles size={14} />
        LEXICO AI VIVA EXAMINER
      </div>

      <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">
        Welcome to your guided Viva setup
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 md:text-base">
        Lexico will help you create a tailored viva session in a few simple steps. Choose your preferred format,
        difficulty, and question style to begin with confidence.
      </p>
    </section>
  );
}
