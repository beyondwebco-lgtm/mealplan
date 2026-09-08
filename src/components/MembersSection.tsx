import React, { useState } from 'react';
import type { Member, Dish } from '../types';
import { Users, UserPlus, Heart, ThumbsDown, X, Trash2, Check, Sparkles } from 'lucide-react';

interface MembersSectionProps {
  members: Member[];
  dishes: Dish[];
  activeMemberId: string;
  onSelectMember: (memberId: string) => void;
  onAddMember: (name: string, avatarColor?: string) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
}

const AVATAR_PALETTE = [
  'bg-emerald-700',
  'bg-teal-700',
  'bg-amber-700',
  'bg-rose-700',
  'bg-indigo-700',
  'bg-cyan-700',
  'bg-blue-700',
];

export const MembersSection: React.FC<MembersSectionProps> = ({
  members,
  dishes,
  activeMemberId,
  onSelectMember,
  onAddMember,
  onDeleteMember,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed || isAdding) return;

    setIsAdding(true);
    try {
      const colorIndex = members.length % AVATAR_PALETTE.length;
      await onAddMember(trimmed, AVATAR_PALETTE[colorIndex]);
      setNewMemberName('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section className="bg-surface rounded-2xl border border-border shadow-xs p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-4">
        <div>
          <h3 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Our Members
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Click any member to see what they like, dislike, and have suggested.
          </p>
        </div>

        {/* Quick Add Member inline form */}
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Add new member..."
            className="text-xs px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary w-40 sm:w-48 text-charcoal placeholder:text-charcoal-muted"
          />
          <button
            type="submit"
            disabled={!newMemberName.trim() || isAdding}
            className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {members.map((member) => {
          const likedDishes = dishes.filter((d) => d.likes.includes(member.id));
          const dislikedDishes = dishes.filter((d) => d.dislikes.includes(member.id));
          const isActive = member.id === activeMemberId;

          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-150 flex flex-col justify-between hover:shadow-card ${
                isActive
                  ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-background hover:bg-surface border-border hover:border-border-dark'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs ${
                    member.avatarColor || 'bg-emerald-700'
                  }`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-charcoal text-sm truncate">
                      {member.name}
                    </h4>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-charcoal-muted mt-0.5">
                    ❤️ {likedDishes.length} likes · 👎 {dislikedDishes.length}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border-light flex items-center justify-between text-xs">
                <span className="text-primary font-semibold text-[11px] group-hover:underline">
                  View tastes →
                </span>
                {!isActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMember(member.id);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-background hover:bg-emerald-100 text-charcoal-muted hover:text-emerald-800 border border-border"
                  >
                    Switch to
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-modal overflow-hidden p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-lg shadow-sm ${
                    selectedMember.avatarColor || 'bg-emerald-700'
                  }`}
                >
                  {selectedMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal">
                    {selectedMember.name}
                  </h3>
                  <p className="text-xs text-charcoal-muted">
                    Individual tastes contributing to the group
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-lg hover:bg-border-light"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Things I Like */}
            {(() => {
              const liked = dishes.filter((d) => d.likes.includes(selectedMember.id));
              const disliked = dishes.filter((d) => d.dislikes.includes(selectedMember.id));
              const suggested = dishes.filter(
                (d) =>
                  d.suggestedByMemberId === selectedMember.id ||
                  d.suggestedBy.toLowerCase() === selectedMember.name.toLowerCase()
              );

              return (
                <div className="space-y-4">
                  {/* Likes Section */}
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        Things I Like ({liked.length})
                      </span>
                    </div>
                    {liked.length === 0 ? (
                      <p className="text-xs text-charcoal-muted italic">
                        Hasn&apos;t liked any dishes yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {liked.map((dish) => (
                          <span
                            key={dish.id}
                            className="px-2.5 py-1 rounded-lg bg-surface text-emerald-900 border border-emerald-300 text-xs font-semibold"
                          >
                            {dish.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dislikes Section */}
                  <div className="bg-red-50/50 rounded-xl p-4 border border-red-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        Things I Don&apos;t Like ({disliked.length})
                      </span>
                    </div>
                    {disliked.length === 0 ? (
                      <p className="text-xs text-charcoal-muted italic">
                        No food avoidances marked.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {disliked.map((dish) => (
                          <span
                            key={dish.id}
                            className="px-2.5 py-1 rounded-lg bg-surface text-red-900 border border-red-300 text-xs font-semibold"
                          >
                            {dish.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dishes Suggested by this member */}
                  <div className="bg-background rounded-xl p-4 border border-border space-y-2">
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Ideas Suggested by {selectedMember.name} ({suggested.length})
                    </span>
                    {suggested.length === 0 ? (
                      <p className="text-xs text-charcoal-muted italic">
                        Hasn&apos;t suggested any dishes yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {suggested.map((dish) => (
                          <span
                            key={dish.id}
                            className="px-2.5 py-1 rounded-lg bg-surface text-charcoal border border-border text-xs font-medium"
                          >
                            {dish.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: Delete member option (if more than 1 member exists) */}
                  {members.length > 1 && (
                    <div className="pt-2 flex justify-between items-center border-t border-border-light">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to remove ${selectedMember.name} from the group?`
                            )
                          ) {
                            onDeleteMember(selectedMember.id);
                            setSelectedMember(null);
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove member
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectMember(selectedMember.id);
                          setSelectedMember(null);
                        }}
                        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Set as Active Member
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
