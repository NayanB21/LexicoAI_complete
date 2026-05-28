import { Keyboard, Mic } from 'lucide-react';
import VivaStepCard from '../VivaStepCard';
import VoiceComingSoonCard from '../VoiceComingSoonCard';

export default function StepMode({ value, onChange }) {
  const isVoice = value === 'voice';

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <p className="text-sm font-semibold text-white md:text-base">Choose your viva mode</p>
        <p className="mt-1 text-xs text-gray-400 md:text-sm">Text mode is available now. Voice mode is preview-only.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <VivaStepCard
          title="Text Based"
          subtitle="Available now"
          icon={<Keyboard size={16} />}
          selected={value === 'text'}
          onClick={() => onChange('text')}
          accentClass="from-cyan-500/20 to-indigo-500/20"
        />
        <VivaStepCard
          title="Voice Based"
          subtitle="Coming soon"
          icon={<Mic size={16} />}
          selected={value === 'voice'}
          onClick={() => onChange('voice')}
          accentClass="from-fuchsia-500/20 to-indigo-500/20"
        />
      </div>

      {isVoice ? <VoiceComingSoonCard /> : null}
    </section>
  );
}
