import React from 'react';
import type { Member } from '../types';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';

interface MemberSelectScreenProps {
  members: Member[];
  onSelectMember: (memberId: string) => void;
}

export const MemberSelectScreen: React.FC<MemberSelectScreenProps> = ({
  members,
  onSelectMember,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8 antialiased">
      <div className="w-full max-w-sm mx-auto space-y-6 text-center">
        {/* Logo & Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto shadow-subtle">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
              MealTogether
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              What are you craving today?
            </p>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="pt-2">
          <h2 className="text-base sm:text-lg font-bold text-charcoal">
            Who are you?
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Choose your name to start
          </p>
        </div>

        {/* Member Buttons List */}
        <div className="space-y-2.5 pt-1">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectMember(member.id)}
              className="w-full bg-surface hover:bg-primary-soft hover:border-primary/40 active:scale-[0.99] border border-border rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-all shadow-subtle min-h-touch group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-sm ${
                    member.avatarColor || 'bg-primary'
                  }`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-base text-charcoal group-hover:text-primary transition-colors">
                  {member.name}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
