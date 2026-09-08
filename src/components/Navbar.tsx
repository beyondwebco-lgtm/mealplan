import React from 'react';
import type { Member, Group } from '../types';
import { Utensils, Users, Database } from 'lucide-react';

interface NavbarProps {
  group: Group;
  members: Member[];
  activeMemberId: string;
  onChangeActiveMember: (memberId: string) => void;
  onOpenMembers: () => void;
  isDbConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  group,
  members,
  activeMemberId,
  onChangeActiveMember,
  onOpenMembers,
  isDbConnected,
}) => {
  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-charcoal tracking-tight">
                MealTogether
              </h1>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {group.name}
              </span>
            </div>
            <p className="text-[11px] text-charcoal-muted hidden sm:block">
              Collaborative Food Ideas &amp; Tastes Board
            </p>
          </div>
        </div>

        {/* Right Actions: Member Switcher & Members Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Member Selector */}
          {members.length > 0 && (
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1 text-xs shadow-xs">
              <span className="text-charcoal-muted hidden md:inline font-medium text-[11px]">
                You are:
              </span>
              <div
                className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                  activeMember?.avatarColor || 'bg-emerald-700'
                }`}
              >
                {activeMember?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <select
                value={activeMemberId}
                onChange={(e) => onChangeActiveMember(e.target.value)}
                className="bg-transparent font-bold text-charcoal focus:outline-none cursor-pointer text-xs"
                title="Switch active member"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Members Button */}
          <button
            type="button"
            onClick={onOpenMembers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-border-light border border-border text-charcoal text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Members</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary-soft text-primary font-bold">
              {members.length}
            </span>
          </button>

          {/* Database indicator */}
          <div
            className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800"
            title={isDbConnected ? 'Connected to Neon PostgreSQL' : 'Connecting to database...'}
          >
            <Database className="w-3 h-3 text-emerald-600" />
            <span className="font-semibold">Neon DB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
