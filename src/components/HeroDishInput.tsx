import React, { useState } from 'react';
import type { Member } from '../types';
import { Plus, Check } from 'lucide-react';

interface HeroDishInputProps {
  members: Member[];
  activeMemberId: string;
  onChangeActiveMember: (memberId: string) => void;
  onAddDish: (name: string, suggestedBy: string, suggestedByMemberId?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const HeroDishInput: React.FC<HeroDishInputProps> = ({
  members,
  activeMemberId,
  onAddDish,
  isSubmitting = false,
}) => {
  const [dishName, setDishName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
    }, 1800);
  };

  return (
    <section id="top" className="pt-2 pb-1 space-y-4">
      {/* Top Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">
          {getGreeting()}{activeMember?.name ? `, ${activeMember.name}` : ''} 👋
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted mt-0.5 font-normal">
          What should we eat?
        </p>
      </div>

      {/* Main Input Card */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="Idli, dosa, upma, paneer curry..."
            disabled={isSubmitting}
            className="w-full bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm sm:text-base text-charcoal placeholder-charcoal-muted/60 focus:outline-none transition-all shadow-subtle min-h-touch"
          />
        </div>

        <button
          type="submit"
          disabled={!dishName.trim() || isSubmitting}
          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all min-h-touch shadow-subtle ${
            isSuccess
              ? 'bg-primary-soft text-primary font-bold border border-primary/20'
              : 'bg-primary hover:bg-primary-hover text-white active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-4 h-4 text-primary stroke-[2.5]" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Idea</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};

