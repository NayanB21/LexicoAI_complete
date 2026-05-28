import { CheckSquare, FileText, Scale, Sigma } from 'lucide-react';
import VivaStepCard from '../VivaStepCard';

const types = [
  {
    key: 'MCQ',
    subtitle: 'Objective multi-option',
    icon: <CheckSquare size={16} />,
    accentClass: 'from-blue-500/25 to-cyan-500/20',
  },
  {
    key: 'Short Answer',
    subtitle: 'Crisp explanatory responses',
    icon: <FileText size={16} />,
    accentClass: 'from-indigo-500/25 to-purple-500/20',
  },
  {
    key: 'True/False',
    subtitle: 'Rapid concept checks',
    icon: <Sigma size={16} />,
    accentClass: 'from-emerald-500/25 to-teal-500/20',
  },
  {
    key: 'Assertion Reason',
    subtitle: 'Deep reasoning format',
    icon: <Scale size={16} />,
    accentClass: 'from-fuchsia-500/25 to-rose-500/20',
  },
];

export default function StepQuestionType({ value, onChange }) {
  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <p className="text-sm font-semibold text-white md:text-base">Choose question type</p>
        <p className="mt-1 text-xs text-gray-400 md:text-sm">Each type has a unique format. Select one for this session.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {types.map((item) => (
          <VivaStepCard
            key={item.key}
            title={item.key}
            subtitle={item.subtitle}
            icon={item.icon}
            selected={value === item.key}
            onClick={() => onChange(item.key)}
            accentClass={item.accentClass}
          />
        ))}
      </div>
    </section>
  );
}
