import { Flame, Shield, Sparkles } from 'lucide-react';
import VivaStepCard from '../VivaStepCard';

const options = [
  { key: 'Easy', subtitle: 'Comfortable pace', icon: <Shield size={16} />, accent: 'from-emerald-500/20 to-cyan-500/20' },
  { key: 'Medium', subtitle: 'Balanced challenge', icon: <Sparkles size={16} />, accent: 'from-indigo-500/20 to-blue-500/20' },
  { key: 'Hard', subtitle: 'High intensity', icon: <Flame size={16} />, accent: 'from-rose-500/20 to-orange-500/20' },
];

export default function StepDifficulty({ value, onChange }) {
  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <p className="text-sm font-semibold text-white md:text-base">Select difficulty level</p>
        <p className="mt-1 text-xs text-gray-400 md:text-sm">Pick the depth and pressure of your viva experience.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {options.map((item) => (
          <VivaStepCard
            key={item.key}
            title={item.key}
            subtitle={item.subtitle}
            icon={item.icon}
            selected={value === item.key}
            onClick={() => onChange(item.key)}
            accentClass={item.accent}
          />
        ))}
      </div>
    </section>
  );
}
