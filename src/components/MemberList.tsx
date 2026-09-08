import React, { useState } from 'react';
import type { Member } from '../types';
import { MemberCard } from './MemberCard';
import { Users, Plus, Search } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  onOpenAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onAddLike: (memberId: string, dish: string) => void;
  onRemoveLike: (memberId: string, dishIndex: number) => void;
  onAddDislike: (memberId: string, dish: string) => void;
  onRemoveDislike: (memberId: string, dishIndex: number) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  onOpenAddMember,
  onEditMember,
  onDeleteMember,
  onAddLike,
  onRemoveLike,
  onAddDislike,
  onRemoveDislike,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.likes.some((dish) => dish.toLowerCase().includes(q)) ||
      m.dislikes.some((dish) => dish.toLowerCase().includes(q))
    );
  });

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Members & Preferences
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
              {members.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Individual preferences contributing to the collective group meal plan
          </p>
        </div>

        {/* Action & Search */}
        <div className="flex items-center gap-2.5">
          {members.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member or dish..."
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-44 sm:w-52 bg-surface text-charcoal placeholder:text-charcoal-subtle"
              />
            </div>
          )}
          <button
            type="button"
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="bg-surface rounded-2xl border border-dashed border-border-dark p-10 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary-soft flex items-center justify-center text-primary">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal">No members yet</h3>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-sm mx-auto">
              Add everyone participating in the meal plan to start sharing food likes and dislikes.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Member</span>
          </button>
        </div>
      )}

      {/* Filtered Empty State */}
      {members.length > 0 && filteredMembers.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-charcoal-muted text-sm">
          No members or dishes matched &ldquo;{searchQuery}&rdquo;.
        </div>
      )}

      {/* Grid of Member Cards */}
      {filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={onEditMember}
              onDelete={onDeleteMember}
              onAddLike={onAddLike}
              onRemoveLike={onRemoveLike}
              onAddDislike={onAddDislike}
              onRemoveDislike={onRemoveDislike}
            />
          ))}
        </div>
      )}
    </section>
  );
};
