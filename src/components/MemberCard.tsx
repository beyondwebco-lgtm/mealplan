import React, { useState } from 'react';
import type { Member } from '../types';
import { PreferenceTag } from './PreferenceTag';
import { Edit2, Trash2, Plus, Heart, ThumbsDown } from 'lucide-react';
import { normalizeDish, formatDishTitle } from '../utils/preferenceCalculations';

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
  onAddLike: (memberId: string, dish: string) => void;
  onRemoveLike: (memberId: string, dishIndex: number) => void;
  onAddDislike: (memberId: string, dish: string) => void;
  onRemoveDislike: (memberId: string, dishIndex: number) => void;
}

const AVATAR_COLORS = [
  'bg-emerald-700',
  'bg-teal-700',
  'bg-amber-700',
  'bg-rose-700',
  'bg-indigo-700',
  'bg-cyan-700',
  'bg-blue-700',
];

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  onAddLike,
  onRemoveLike,
  onAddDislike,
  onRemoveDislike,
}) => {
  const [quickLikeInput, setQuickLikeInput] = useState('');
  const [quickDislikeInput, setQuickDislikeInput] = useState('');
  const [isAddingLike, setIsAddingLike] = useState(false);
  const [isAddingDislike, setIsAddingDislike] = useState(false);

  const initial = member.name ? member.name.charAt(0).toUpperCase() : '?';
  const colorIndex = Math.abs(
    member.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % AVATAR_COLORS.length;
  const avatarBg = member.avatarColor || AVATAR_COLORS[colorIndex];

  const handleAddQuickLike = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickLikeInput.trim();
    if (!trimmed) return;

    const norm = normalizeDish(trimmed);
    const exists = member.likes.some((d) => normalizeDish(d) === norm);
    if (!exists) {
      onAddLike(member.id, formatDishTitle(trimmed));
    }
    setQuickLikeInput('');
    setIsAddingLike(false);
  };

  const handleAddQuickDislike = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickDislikeInput.trim();
    if (!trimmed) return;

    const norm = normalizeDish(trimmed);
    const exists = member.dislikes.some((d) => normalizeDish(d) === norm);
    if (!exists) {
      onAddDislike(member.id, formatDishTitle(trimmed));
    }
    setQuickDislikeInput('');
    setIsAddingDislike(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Card Header */}
      <div className="p-5 pb-4 border-b border-border-light flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm ${avatarBg}`}
          >
            {initial}
          </div>
          <div>
            <h3 className="font-bold text-charcoal text-base leading-tight">
              {member.name}
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              {member.likes.length} liked · {member.dislikes.length} disliked
            </p>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="p-1.5 text-charcoal-muted hover:text-primary hover:bg-primary-soft rounded-lg transition-colors"
            title="Edit member"
            aria-label={`Edit ${member.name}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(member.id)}
            className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove member"
            aria-label={`Delete ${member.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body: Preferences */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Likes Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              Likes ({member.likes.length})
            </span>
            {!isAddingLike && (
              <button
                type="button"
                onClick={() => setIsAddingLike(true)}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
            {member.likes.length === 0 && !isAddingLike ? (
              <span className="text-xs text-charcoal-subtle italic">No liked dishes added yet</span>
            ) : (
              member.likes.map((dish, idx) => (
                <PreferenceTag
                  key={`${dish}-${idx}`}
                  label={dish}
                  type="like"
                  size="sm"
                  onRemove={() => onRemoveLike(member.id, idx)}
                />
              ))
            )}
          </div>

          {/* Quick inline like adder */}
          {isAddingLike && (
            <form onSubmit={handleAddQuickLike} className="flex gap-1.5 pt-1">
              <input
                type="text"
                autoFocus
                value={quickLikeInput}
                onChange={(e) => setQuickLikeInput(e.target.value)}
                placeholder="e.g. Paneer Butter Masala"
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary flex-1 bg-surface"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingLike(false);
                  setQuickLikeInput('');
                }}
                className="px-2 py-1.5 text-xs text-charcoal-muted hover:text-charcoal"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Dislikes Section */}
        <div className="space-y-2 pt-2 border-t border-border-light">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
              Dislikes ({member.dislikes.length})
            </span>
            {!isAddingDislike && (
              <button
                type="button"
                onClick={() => setIsAddingDislike(true)}
                className="text-xs text-red-700 font-medium hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
            {member.dislikes.length === 0 && !isAddingDislike ? (
              <span className="text-xs text-charcoal-subtle italic">No dislikes recorded</span>
            ) : (
              member.dislikes.map((dish, idx) => (
                <PreferenceTag
                  key={`${dish}-${idx}`}
                  label={dish}
                  type="dislike"
                  size="sm"
                  onRemove={() => onRemoveDislike(member.id, idx)}
                />
              ))
            )}
          </div>

          {/* Quick inline dislike adder */}
          {isAddingDislike && (
            <form onSubmit={handleAddQuickDislike} className="flex gap-1.5 pt-1">
              <input
                type="text"
                autoFocus
                value={quickDislikeInput}
                onChange={(e) => setQuickDislikeInput(e.target.value)}
                placeholder="e.g. Bitter Gourd"
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 flex-1 bg-surface"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingDislike(false);
                  setQuickDislikeInput('');
                }}
                className="px-2 py-1.5 text-xs text-charcoal-muted hover:text-charcoal"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
