import React, { useState } from 'react';
import type { Member, Dish } from '../types';
import { Users, UserPlus, Heart, ThumbsDown, X, Trash2, Check, Sparkles, Plus, ArrowRightLeft } from 'lucide-react';

interface MembersSectionProps {
  members: Member[];
  dishes: Dish[];
  activeMemberId: string;
  onSelectMember: (memberId: string) => void;
  onAddMember: (name: string, avatarColor?: string) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  onToggleLike: (dishId: string, targetMemberId?: string) => Promise<void>;
  onToggleDislike: (dishId: string, targetMemberId?: string) => Promise<void>;
  onAddDishPreference: (dishName: string, memberId: string, preference: 'like' | 'dislike') => Promise<void>;
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
  onToggleLike,
  onToggleDislike,
  onAddDishPreference,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Inputs for adding like / dislike directly within member detail view
  const [customLikeInput, setCustomLikeInput] = useState('');
  const [customDislikeInput, setCustomDislikeInput] = useState('');
  const [isSubmittingPref, setIsSubmittingPref] = useState(false);

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed || isAddingMember) return;

    setIsAddingMember(true);
    try {
      const colorIndex = members.length % AVATAR_PALETTE.length;
      await onAddMember(trimmed, AVATAR_PALETTE[colorIndex]);
      setNewMemberName('');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleAddCustomLike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !customLikeInput.trim() || isSubmittingPref) return;
    setIsSubmittingPref(true);
    try {
      await onAddDishPreference(customLikeInput.trim(), selectedMember.id, 'like');
      setCustomLikeInput('');
    } finally {
      setIsSubmittingPref(false);
    }
  };

  const handleAddCustomDislike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !customDislikeInput.trim() || isSubmittingPref) return;
    setIsSubmittingPref(true);
    try {
      await onAddDishPreference(customDislikeInput.trim(), selectedMember.id, 'dislike');
      setCustomDislikeInput('');
    } finally {
      setIsSubmittingPref(false);
    }
  };

  return (
    <section className="bg-surface rounded-2xl border border-border shadow-xs p-5 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-4">
        <div>
          <h3 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Our Members
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Click any member to update their likes, dislikes, or view their food profile.
          </p>
        </div>

        {/* Quick Add Member inline form */}
        <form onSubmit={handleAddMemberSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Add new member..."
            className="text-xs px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary w-40 sm:w-48 text-charcoal placeholder:text-charcoal-muted"
          />
          <button
            type="submit"
            disabled={!newMemberName.trim() || isAddingMember}
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
                  Manage tastes →
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

      {/* Member Details & Preference Editor Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-surface w-full max-w-xl rounded-2xl border border-border shadow-modal overflow-hidden p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-light pb-4">
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
                    {selectedMember.name}&apos;s Food Tastes
                  </h3>
                  <p className="text-xs text-charcoal-muted">
                    Add or remove favorite dishes and foods to avoid for {selectedMember.name}
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

            {/* Things I Like Section */}
            {(() => {
              const liked = dishes.filter((d) => d.likes.includes(selectedMember.id));
              const disliked = dishes.filter((d) => d.dislikes.includes(selectedMember.id));
              const unratedDishes = dishes.filter(
                (d) => !d.likes.includes(selectedMember.id) && !d.dislikes.includes(selectedMember.id)
              );

              return (
                <div className="space-y-5">
                  {/* 1. LIKES SECTION */}
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        Things {selectedMember.name} Likes ({liked.length})
                      </span>
                    </div>

                    {/* Likes Tag List with Remove / Switch options */}
                    {liked.length === 0 ? (
                      <p className="text-xs text-charcoal-muted italic">
                        No liked dishes yet. Add one below!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {liked.map((dish) => (
                          <span
                            key={dish.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface text-emerald-900 border border-emerald-300 text-xs font-semibold shadow-xs"
                          >
                            <span>{dish.name}</span>

                            {/* Switch to Dislike button */}
                            <button
                              type="button"
                              onClick={() => onToggleDislike(dish.id, selectedMember.id)}
                              className="p-0.5 text-emerald-700/70 hover:text-red-600 rounded"
                              title="Move to Don't Like"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>

                            {/* Remove Like button */}
                            <button
                              type="button"
                              onClick={() => onToggleLike(dish.id, selectedMember.id)}
                              className="p-0.5 text-emerald-700 hover:text-red-700 rounded-full hover:bg-emerald-100"
                              title={`Remove "${dish.name}" from likes`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Input for Likes */}
                    <form onSubmit={handleAddCustomLike} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customLikeInput}
                        onChange={(e) => setCustomLikeInput(e.target.value)}
                        placeholder={`Add a dish ${selectedMember.name} likes (e.g. Masala Dosa)...`}
                        disabled={isSubmittingPref}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-surface focus:outline-none focus:ring-1 focus:ring-emerald-500 text-charcoal"
                      />
                      <button
                        type="submit"
                        disabled={!customLikeInput.trim() || isSubmittingPref}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Like</span>
                      </button>
                    </form>
                  </div>

                  {/* 2. DISLIKES SECTION */}
                  <div className="bg-red-50/50 rounded-2xl p-4 border border-red-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        Things {selectedMember.name} Doesn&apos;t Like ({disliked.length})
                      </span>
                    </div>

                    {/* Dislikes Tag List with Remove / Switch options */}
                    {disliked.length === 0 ? (
                      <p className="text-xs text-charcoal-muted italic">
                        No food avoidances marked.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {disliked.map((dish) => (
                          <span
                            key={dish.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface text-red-900 border border-red-300 text-xs font-semibold shadow-xs"
                          >
                            <span>{dish.name}</span>

                            {/* Switch to Like button */}
                            <button
                              type="button"
                              onClick={() => onToggleLike(dish.id, selectedMember.id)}
                              className="p-0.5 text-red-700/70 hover:text-emerald-600 rounded"
                              title="Move to Likes"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>

                            {/* Remove Dislike button */}
                            <button
                              type="button"
                              onClick={() => onToggleDislike(dish.id, selectedMember.id)}
                              className="p-0.5 text-red-700 hover:text-red-900 rounded-full hover:bg-red-100"
                              title={`Remove "${dish.name}" from dislikes`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Input for Dislikes */}
                    <form onSubmit={handleAddCustomDislike} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customDislikeInput}
                        onChange={(e) => setCustomDislikeInput(e.target.value)}
                        placeholder={`Add a dish to avoid (e.g. Bitter Gourd, Fish)...`}
                        disabled={isSubmittingPref}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-red-300 bg-surface focus:outline-none focus:ring-1 focus:ring-red-500 text-charcoal"
                      />
                      <button
                        type="submit"
                        disabled={!customDislikeInput.trim() || isSubmittingPref}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Dislike</span>
                      </button>
                    </form>
                  </div>

                  {/* 3. QUICK RATING FROM EXISTING GROUP DISHES */}
                  {unratedDishes.length > 0 && (
                    <div className="bg-background rounded-2xl p-4 border border-border space-y-2.5">
                      <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Rate other existing group ideas for {selectedMember.name}:
                      </span>

                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                        {unratedDishes.map((dish) => (
                          <div
                            key={dish.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs"
                          >
                            <span className="font-medium text-charcoal">{dish.name}</span>
                            <button
                              type="button"
                              onClick={() => onToggleLike(dish.id, selectedMember.id)}
                              className="p-1 rounded text-emerald-700 hover:bg-emerald-50 hover:font-bold"
                              title="Like"
                            >
                              ❤️
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleDislike(dish.id, selectedMember.id)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 hover:font-bold"
                              title="Dislike"
                            >
                              👎
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 flex justify-between items-center border-t border-border-light">
                    {members.length > 1 ? (
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
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectMember(selectedMember.id);
                          setSelectedMember(null);
                        }}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Done / Switch to {selectedMember.name}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
