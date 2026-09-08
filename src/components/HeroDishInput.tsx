import React, { useState } from 'react';
import type { Member } from '../types';
import { Plus, Sparkles, X, User } from 'lucide-react';

interface HeroDishInputProps {
  members: Member[];
  activeMemberId: string;
  onChangeActiveMember: (memberId: string) => void;
  onAddDish: (name: string, suggestedBy: string, suggestedByMemberId?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const SAMPLE_CHIPS = [
  '🥞 Dosa',
  '🥣 Idli & Sambar',
  '🥘 Paneer Butter Masala',
  '🍲 Dal Tadka',
  '🍚 Vegetable Biryani',
  '🥣 Upma',
  '🍗 Chicken Curry',
  '🫓 Poori Bhaji',
  '🍛 Aloo Curry & Chapati',
];

export const HeroDishInput: React.FC<HeroDishInputProps> = ({
  members,
  activeMemberId,
  onChangeActiveMember,
  onAddDish,
  isSubmitting = false,
}) => {
  const [dishName, setDishName] = useState('');

  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = dishName.trim();
    if (!trimmed || isSubmitting) return;

    await onAddDish(
      trimmed,
      activeMember?.name || 'Anonymous',
      activeMember?.id
    );
    setDishName('');
  };

  const handleChipClick = (chipText: string) => {
    // Strip leading emoji if present
    const cleaned = chipText.replace(/^[^\w\s]+\s*/, '');
    setDishName(cleaned);
  };

  return (
    <section className="bg-surface rounded-2xl sm:rounded-3xl border border-border shadow-card p-6 sm:p-8 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight flex items-center gap-2">
            What should we eat?
            <span className="text-amber-500">🍲</span>
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Suggest any meal, curry, craving, or dish idea for the group:
          </p>
        </div>

        {/* Submitter selector */}
        {members.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-background px-3 py-1.5 rounded-xl border border-border text-xs">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-charcoal-muted font-medium">Suggest as:</span>
            <select
              value={activeMemberId}
              onChange={(e) => onChangeActiveMember(e.target.value)}
              className="bg-transparent font-bold text-charcoal focus:outline-none cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="Suggest a dish... (e.g. Dosa, Paneer Butter Masala, Dal Tadka, Biryani)"
            disabled={isSubmitting}
            className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-sm sm:text-base text-charcoal placeholder-charcoal-muted/60 focus:outline-none transition-all"
            autoFocus
          />
          {dishName && (
            <button
              type="button"
              onClick={() => setDishName('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-charcoal-muted hover:text-charcoal rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!dishName.trim() || isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Idea</span>
        </button>
      </form>

      {/* Quick Example Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[11px] font-semibold text-charcoal-muted flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick ideas:
        </span>
        {SAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="px-3 py-1 rounded-xl bg-background hover:bg-emerald-50 border border-border hover:border-emerald-300 text-charcoal text-xs font-medium transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
};
