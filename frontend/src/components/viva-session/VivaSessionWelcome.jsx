export default function VivaSessionWelcome() {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-300">
        LEXICO AI EXAMINER
      </div>

      <h2 className="mt-4 text-2xl md:text-3xl font-bold text-white">
        Welcome to your premium Viva Session
      </h2>

      <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-300 leading-relaxed">
        Lexico will guide you through a focused viva experience designed to feel natural, structured, and adaptive.
        In the next phase, you will configure question count, mode, difficulty, and question style before starting.
      </p>
    </section>
  );
}
