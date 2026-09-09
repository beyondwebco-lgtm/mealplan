import React, { useState } from 'react';
import type { Member, Dish } from '../types';
import { X, Heart, ThumbsDown, Trash2 } from 'lucide-react';

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
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [likeInput, setLikeInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [isSubmittingPref, setIsSubmittingPref] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed || isAdding) return;

    setIsAdding(true);
    try {
      await onAddMember(trimmed);
      setNewMemberName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddLike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !likeInput.trim() || isSubmittingPref) return;
    setIsSubmittingPref(true);
    try {
      await onAddDishPreference(likeInput.trim(), selectedMember.id, 'like');
      setLikeInput('');
    } finally {
      setIsSubmittingPref(false);
    }
  };

  const handleAddDislike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !dislikeInput.trim() || isSubmittingPref) return;
    setIsSubmittingPref(true);
    try {
      await onAddDishPreference(dislikeInput.trim(), selectedMember.id, 'dislike');
      setDislikeInput('');
    } finally {
      setIsSubmittingPref(false);
    }
  };

  return (
    <section id="members-section" className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-charcoal">
          Our Members
        </h2>
        <span className="text-xs text-charcoal-muted">
          Tap member to view taste profile
        </span>
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {members.map((member) => {
          const likedCount = dishes.filter((d) => d.likes.includes(member.id)).length;
          const dislikedCount = dishes.filter((d) => d.dislikes.includes(member.id)).length;
          const isActive = member.id === activeMemberId;

          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`w-full text-left bg-surface border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-subtle min-h-touch ${
                isActive
                  ? 'border-primary/50 ring-1 ring-primary/20'
                  : 'border-border hover:border-charcoal-subtle'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-charcoal">
                    {member.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  {likedCount} likes · {dislikedCount} dislikes
                </p>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => onSelectMember(member.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border text-charcoal hover:bg-background transition-colors min-h-touch flex items-center"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Minimal Add Member Form */}
      <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-subtle space-y-2">
        <span className="text-xs font-bold text-charcoal block">Add Member</span>
        <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Name"
            className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-charcoal focus:outline-none focus:border-primary min-h-touch"
          />
          <button
            type="submit"
            disabled={!newMemberName.trim() || isAdding}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 min-h-touch shrink-0"
          >
            Add Member
          </button>
        </form>
      </div>

      {/* Minimal Member Profile Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-modal p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-light">
              <div>
                <h3 className="text-lg font-bold text-charcoal">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-charcoal-muted">Taste preferences</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const liked = dishes.filter((d) => d.likes.includes(selectedMember.id));
              const disliked = dishes.filter((d) => d.dislikes.includes(selectedMember.id));

              return (
                <div className="space-y-4 text-xs">
                  {/* Likes Section */}
                  <div className="space-y-2">
                    <span className="font-bold text-charcoal flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700" />
                      <span>Likes ({liked.length})</span>
                    </span>

                    {liked.length === 0 ? (
                      <p className="text-charcoal-muted italic text-[11px]">No liked dishes yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {liked.map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-like-bg border border-like-border text-like-text font-medium text-xs"
                          >
                            <span>{d.name}</span>
                            <button
                              type="button"
                              onClick={() => onToggleLike(d.id, selectedMember.id)}
                              className="p-0.5 hover:text-red-700"
                              title="Remove like"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Like */}
                    <form onSubmit={handleAddLike} className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={likeInput}
                        onChange={(e) => setLikeInput(e.target.value)}
                        placeholder={`Add dish ${selectedMember.name} likes...`}
                        disabled={isSubmittingPref}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={!likeInput.trim() || isSubmittingPref}
                        className="px-3 py-1.5 bg-primary text-white font-semibold rounded-lg text-xs disabled:opacity-40"
                      >
                        + Add
                      </button>
                    </form>
                  </div>

                  {/* Dislikes Section */}
                  <div className="space-y-2 pt-2 border-t border-border-light">
                    <span className="font-bold text-charcoal flex items-center gap-1.5">
                      <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                      <span>Doesn&apos;t Like ({disliked.length})</span>
                    </span>

                    {disliked.length === 0 ? (
                      <p className="text-charcoal-muted italic text-[11px]">No avoidances marked.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {disliked.map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dislike-bg border border-dislike-border text-dislike-text font-medium text-xs"
                          >
                            <span>{d.name}</span>
                            <button
                              type="button"
                              onClick={() => onToggleDislike(d.id, selectedMember.id)}
                              className="p-0.5 hover:text-red-900"
                              title="Remove dislike"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Dislike */}
                    <form onSubmit={handleAddDislike} className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={dislikeInput}
                        onChange={(e) => setDislikeInput(e.target.value)}
                        placeholder={`Add food to avoid...`}
                        disabled={isSubmittingPref}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-charcoal focus:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={!dislikeInput.trim() || isSubmittingPref}
                        className="px-3 py-1.5 bg-dislike-text text-white font-semibold rounded-lg text-xs disabled:opacity-40"
                      >
                        + Add
                      </button>
                    </form>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border-light flex items-center justify-between">
                    {members.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${selectedMember.name} from group?`)) {
                            onDeleteMember(selectedMember.id);
                            setSelectedMember(null);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={() => {
                        onSelectMember(selectedMember.id);
                        setSelectedMember(null);
                      }}
                      className="px-3.5 py-1.5 bg-primary text-white font-semibold rounded-lg text-xs"
                    >
                      Set as active user
                    </button>
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

