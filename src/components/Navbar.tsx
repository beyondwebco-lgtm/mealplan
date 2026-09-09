import React from 'react';
import type { Member, Group } from '../types';
import { UtensilsCrossed, Users, Home, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  group: Group;
  members: Member[];
  activeMemberId: string;
  currentView: 'home' | 'dashboard';
  onNavigate: (view: 'home' | 'dashboard') => void;
  onOpenMembers: () => void;
  onScrollToSection?: (sectionId: string) => void;
  onSwitchMember: () => void;
  isDbConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  members,
  activeMemberId,
  currentView,
  onNavigate,
  onOpenMembers,
  onScrollToSection,
  onSwitchMember,
}) => {
  const activeMember = members.find((m) => m.id === activeMemberId);

  const handleNavClick = (sectionId: string) => {
    if (currentView !== 'dashboard') {
      onNavigate('dashboard');
      setTimeout(() => {
        if (sectionId === 'members-section') {
          onOpenMembers();
        } else if (onScrollToSection) {
          onScrollToSection(sectionId);
        }
      }, 50);
      return;
    }

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
          {/* Logo / Home trigger */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-charcoal tracking-tight group-hover:text-primary transition-colors">
              MealTogether
            </span>
          </button>

          {/* Desktop Nav links & Member Switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-background border border-border p-0.5 rounded-lg text-xs mr-1">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-surface text-charcoal font-bold shadow-subtle'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-surface text-charcoal font-bold shadow-subtle'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Dashboard
              </button>
            </div>

            {/* Current Member Indicator */}
            <button
              type="button"
              onClick={onSwitchMember}
              className="flex items-center gap-1.5 bg-background hover:bg-primary-soft border border-border hover:border-primary/30 rounded-full px-2.5 sm:px-3 py-1 text-xs text-charcoal transition-all min-h-touch"
              title="Switch to another member"
            >
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {activeMember?.name?.charAt(0).toUpperCase() || '👤'}
              </span>
              <span className="font-semibold text-xs text-charcoal">
                {activeMember?.name || 'Member'}
              </span>
              <span className="text-[10px] text-charcoal-muted ml-0.5 underline hidden xs:inline">
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
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors min-h-touch ${
              currentView === 'home' ? 'text-primary font-bold' : 'text-charcoal-muted hover:text-primary'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('ideas-section')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors min-h-touch ${
              currentView === 'dashboard' ? 'text-primary font-bold' : 'text-charcoal-muted hover:text-primary'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px]">Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('members-section')}
            className="flex flex-col items-center justify-center gap-1 text-charcoal-muted hover:text-primary transition-colors min-h-touch"
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">Members</span>
          </button>
        </div>
      </nav>
    </>
  );
};


