import { Hash } from 'lucide-react';
import VivaStepCard from '../VivaStepCard';

const questionOptions = [5, 10, 15, 20];

export default function StepQuestionCount({ value, onChange }) {
  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <p className="text-sm font-semibold text-white md:text-base">How many questions should this viva have?</p>
        <p className="mt-1 text-xs text-gray-400 md:text-sm">Select a balanced question count for this session.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {questionOptions.map((count) => (
          <VivaStepCard
            key={count}
            title={`${count} Questions`}
            subtitle="Recommended"
            icon={<Hash size={16} />}
            selected={value === count}
            onClick={() => onChange(count)}
          />
        ))}
      </div>
    </section>
  );
}
