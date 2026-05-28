export default function VivaStepCard({
  title,
  subtitle,
  icon,
  selected = false,
  onClick,
  disabled = false,
  accentClass = 'from-indigo-500/20 to-purple-500/20',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 md:p-5 ${
        selected
          ? 'border-indigo-400/70 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(129,140,248,0.35),0_10px_35px_rgba(79,70,229,0.35)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-0.5'}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClass} opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${selected ? 'opacity-100' : ''}`} />

      <div className="relative z-10 flex items-start gap-3">
        {icon && (
          <div
            className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border text-gray-200 ${
              selected ? 'border-indigo-300/40 bg-indigo-500/20' : 'border-white/15 bg-black/30'
            }`}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white md:text-base">{title}</h4>
          {subtitle ? <p className="mt-1 text-xs text-gray-300 md:text-sm">{subtitle}</p> : null}
        </div>
      </div>
    </button>
  );
}
