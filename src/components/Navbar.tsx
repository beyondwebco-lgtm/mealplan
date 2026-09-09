import React from 'react';
import type { Member, Group } from '../types';
import { UtensilsCrossed, Users, Home, Lightbulb } from 'lucide-react';

interface NavbarProps {
  group: Group;
  members: Member[];
  activeMemberId: string;
  onChangeActiveMember: (memberId: string) => void;
  onOpenMembers: () => void;
  onScrollToSection?: (sectionId: string) => void;
  onSwitchMember: () => void;
  isDbConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  members,
  activeMemberId,
  onOpenMembers,
  onScrollToSection,
  onSwitchMember,
}) => {
  const activeMember = members.find((m) => m.id === activeMemberId);

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'members-section') {
      onOpenMembers();
      return;
    }
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-charcoal tracking-tight">
              MealTogether
            </span>
          </a>

          {/* Current Member & Switch Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchMember}
              className="flex items-center gap-1.5 bg-background hover:bg-primary-soft border border-border hover:border-primary/30 rounded-full px-3 py-1 text-xs text-charcoal transition-all min-h-touch"
              title="Switch to another member"
            >
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {activeMember?.name?.charAt(0).toUpperCase() || '👤'}
              </span>
              <span className="font-semibold text-xs text-charcoal">
                {activeMember?.name || 'Member'}
              </span>
              <span className="text-[10px] text-charcoal-muted ml-0.5 underline">
                Switch
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border sm:hidden">
        <div className="grid grid-cols-3 h-14 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleNavClick('top')}
            className="flex flex-col items-center justify-center gap-1 text-charcoal-muted hover:text-primary active:text-primary transition-colors min-h-touch"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('ideas-section')}
            className="flex flex-col items-center justify-center gap-1 text-charcoal-muted hover:text-primary active:text-primary transition-colors min-h-touch"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="text-[10px] font-medium">Ideas</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('members-section')}
            className="flex flex-col items-center justify-center gap-1 text-charcoal-muted hover:text-primary active:text-primary transition-colors min-h-touch"
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-medium">Members</span>
          </button>
        </div>
      </nav>
    </>
  );
};

