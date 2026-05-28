import { Mic, Sparkles } from 'lucide-react';

export default function VoiceComingSoonCard() {
  return (
    <div className="rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/35 to-indigo-950/25 p-4 md:p-5 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-200">
          <Mic size={18} />
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white md:text-base">
            Voice Based Viva is coming soon
            <Sparkles size={14} className="text-fuchsia-300" />
          </p>
          <p className="mt-1 text-xs text-fuchsia-100/90 md:text-sm">
            We are polishing a real-time voice examiner experience. For now, please choose Text Based mode to continue.
          </p>
        </div>
      </div>
    </div>
  );
}
