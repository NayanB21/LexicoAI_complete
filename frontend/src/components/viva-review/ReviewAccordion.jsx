import { ChevronDown } from 'lucide-react';

export default function ReviewAccordion({ id, title, subtitle, isOpen, onToggle, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] sm:px-5"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white sm:text-base">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className="border-t border-white/10 px-4 py-4 sm:px-5 sm:py-5"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
