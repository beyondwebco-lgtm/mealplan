import React, { useState, useEffect } from 'react';
import type { Member } from '../types';
import { PreferenceTag } from './PreferenceTag';
import { X, Plus, Heart, ThumbsDown, User, AlertCircle } from 'lucide-react';
import { normalizeDish, formatDishTitle } from '../utils/preferenceCalculations';

interface AddMemberModalProps {
  isOpen: boolean;
  editingMember: Member | null;
  onClose: () => void;
  onSave: (memberData: { name: string; likes: string[]; dislikes: string[] }) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  editingMember,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [likeInput, setLikeInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setLikes([...editingMember.likes]);
      setDislikes([...editingMember.dislikes]);
    } else {
      setName('');
      setLikes([]);
      setDislikes([]);
    }
    setLikeInput('');
    setDislikeInput('');
    setError(null);
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const handleAddLike = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = likeInput.trim();
    if (!trimmed) return;

    const norm = normalizeDish(trimmed);
    if (likes.some((d) => normalizeDish(d) === norm)) {
      setLikeInput('');
      return;
    }

    setLikes([...likes, formatDishTitle(trimmed)]);
    setLikeInput('');
  };

  const handleRemoveLike = (index: number) => {
    setLikes(likes.filter((_, idx) => idx !== index));
  };

  const handleAddDislike = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = dislikeInput.trim();
    if (!trimmed) return;

    const norm = normalizeDish(trimmed);
    if (dislikes.some((d) => normalizeDish(d) === norm)) {
      setDislikeInput('');
      return;
    }

    setDislikes([...dislikes, formatDishTitle(trimmed)]);
    setDislikeInput('');
  };

  const handleRemoveDislike = (index: number) => {
    setDislikes(dislikes.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a member name.');
      return;
    }

    onSave({
      name: trimmedName,
      likes,
      dislikes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-modal overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-charcoal text-lg">
                {editingMember ? 'Edit Member Preferences' : 'Add New Member'}
              </h2>
              <p className="text-xs text-charcoal-muted">
                {editingMember ? 'Update favorite curries and foods to avoid' : 'Add a person and their food preferences'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-border-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider">
              Member Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Rahul, Priya, Alex"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-charcoal"
            />
          </div>

          {/* Likes Section */}
          <div className="space-y-2 pt-2 border-t border-border-light">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Likes (Curries / Dishes)
              </label>
            </div>
            <p className="text-[11px] text-charcoal-muted">
              Add curries, main courses, or ingredients they love eating.
            </p>

            {/* Input and Add Button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={likeInput}
                onChange={(e) => setLikeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLike();
                  }
                }}
                placeholder="e.g. Paneer Butter Masala, Dal Tadka..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
              />
              <button
                type="button"
                onClick={() => handleAddLike()}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Chips Container */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-xl bg-background border border-border-light items-center">
              {likes.length === 0 ? (
                <span className="text-xs text-charcoal-subtle italic">No liked dishes added yet</span>
              ) : (
                likes.map((dish, idx) => (
                  <PreferenceTag
                    key={`${dish}-${idx}`}
                    label={dish}
                    type="like"
                    onRemove={() => handleRemoveLike(idx)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Dislikes Section */}
          <div className="space-y-2 pt-2 border-t border-border-light">
            <div className="flex items-center gap-1.5">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <label className="block text-xs font-bold text-red-900 uppercase tracking-wider">
                Dislikes (Avoid / Allergies)
              </label>
            </div>
            <p className="text-[11px] text-charcoal-muted">
              Add dishes or curries they prefer not to have.
            </p>

            {/* Input and Add Button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={dislikeInput}
                onChange={(e) => setDislikeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDislike();
                  }
                }}
                placeholder="e.g. Bitter Gourd Curry, Brinjal..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-border focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-surface"
              />
              <button
                type="button"
                onClick={() => handleAddDislike()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Chips Container */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-xl bg-background border border-border-light items-center">
              {dislikes.length === 0 ? (
                <span className="text-xs text-charcoal-subtle italic">No disliked dishes added</span>
              ) : (
                dislikes.map((dish, idx) => (
                  <PreferenceTag
                    key={`${dish}-${idx}`}
                    label={dish}
                    type="dislike"
                    onRemove={() => handleRemoveDislike(idx)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border-light flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-charcoal-muted hover:text-charcoal hover:bg-border-light rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
