import React, { useState } from 'react';
import type { Dish, Member } from '../types';
import { Plus, Check, ArrowRight, Heart, ThumbsDown } from 'lucide-react';

interface SimpleHomePageProps {
  members: Member[];
  activeMemberId: string;
  dishes: Dish[];
  onAddDish: (name: string, suggestedBy: string, suggestedByMemberId?: string) => Promise<void>;
  onAddPreference?: (dishName: string, memberId: string, preference: 'like' | 'dislike') => Promise<void>;
  onOpenDashboard: () => void;
  isSubmitting?: boolean;
}

export const SimpleHomePage: React.FC<SimpleHomePageProps> = ({
  members,
  activeMemberId,
  dishes,
  onAddDish,
  onAddPreference,
  onOpenDashboard,
  isSubmitting = false,
}) => {
  const [dishName, setDishName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Separate states for adding directly to Likes and Dislikes
  const [likeInput, setLikeInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [isAddingLike, setIsAddingLike] = useState(false);
  const [isAddingDislike, setIsAddingDislike] = useState(false);

  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  const handleSubmitIdea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = dishName.trim();
    if (!trimmed || isSubmitting) return;

    await onAddDish(
      trimmed,
      activeMember?.name || 'Anonymous',
      activeMember?.id
    );
    setDishName('');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
    }, 1800);
  };

  const handleAddLike = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = likeInput.trim();
    if (!trimmed || !onAddPreference || !activeMember?.id) return;
    setIsAddingLike(true);
    try {
      await onAddPreference(trimmed, activeMember.id, 'like');
      setLikeInput('');
    } finally {
      setIsAddingLike(false);
    }
  };

  const handleAddDislike = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = dislikeInput.trim();
    if (!trimmed || !onAddPreference || !activeMember?.id) return;
    setIsAddingDislike(true);
    try {
      await onAddPreference(trimmed, activeMember.id, 'dislike');
      setDislikeInput('');
    } finally {
      setIsAddingDislike(false);
    }
  };

  // Group liked dishes (dishes with at least 1 like)
  const likedDishes = dishes.filter((d) => d.likes.length > 0);

  // Group disliked dishes (dishes with at least 1 dislike)
  const dislikedDishes = dishes.filter((d) => d.dislikes.length > 0);

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Top — Add Ideas */}
      <section className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">
            What should we eat?
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Suggest a meal or dish for the group:
          </p>
        </div>

        <form onSubmit={handleSubmitIdea} className="space-y-2.5">
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="Idli, Dosa, Upma, Paneer..."
            disabled={isSubmitting}
            className="w-full bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm sm:text-base text-charcoal placeholder-charcoal-muted/60 focus:outline-none transition-all shadow-subtle min-h-touch"
          />

          <button
            type="submit"
            disabled={!dishName.trim() || isSubmitting}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all min-h-touch shadow-subtle ${
              isSuccess
                ? 'bg-primary-soft text-primary font-bold border border-primary/20'
                : 'bg-primary hover:bg-primary-hover text-white active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4 text-primary stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Idea</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* 2. Below — Likes and Dislikes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Likes Box */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3 shadow-subtle flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-border-light pb-2">
              <Heart className="w-4 h-4 text-emerald-700 fill-emerald-700" />
              <h2 className="text-sm font-bold text-charcoal">Likes</h2>
              <span className="text-[11px] font-semibold text-charcoal-muted ml-auto bg-stone-100 px-1.5 py-0.5 rounded-full">
                {likedDishes.length}
              </span>
            </div>

            {likedDishes.length === 0 ? (
              <p className="text-xs text-charcoal-muted italic py-1">No liked dishes yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {likedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 bg-stone-50 rounded-lg text-charcoal border border-border-light"
                  >
                    <span className="font-medium truncate">{dish.name}</span>
                    <span className="text-[11px] font-semibold text-emerald-800 shrink-0 ml-2">
                      ❤️ {dish.likes.length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Like Form */}
          <form onSubmit={handleAddLike} className="pt-2 border-t border-border-light flex gap-1.5">
            <input
              type="text"
              value={likeInput}
              onChange={(e) => setLikeInput(e.target.value)}
              placeholder="Add a dish you like..."
              disabled={isAddingLike}
              className="flex-1 min-w-0 bg-stone-50 border border-border focus:border-primary focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-charcoal placeholder-charcoal-muted/60 focus:outline-none min-h-[38px]"
            />
            <button
              type="submit"
              disabled={!likeInput.trim() || isAddingLike}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 rounded-lg flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 min-h-[38px] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Dislikes Box */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3 shadow-subtle flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-border-light pb-2">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-charcoal">Dislikes</h2>
              <span className="text-[11px] font-semibold text-charcoal-muted ml-auto bg-stone-100 px-1.5 py-0.5 rounded-full">
                {dislikedDishes.length}
              </span>
            </div>

            {dislikedDishes.length === 0 ? (
              <p className="text-xs text-charcoal-muted italic py-1">No dislikes marked.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {dislikedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 bg-stone-50 rounded-lg text-charcoal border border-border-light"
                  >
                    <span className="font-medium text-charcoal truncate">{dish.name}</span>
                    <span className="text-[11px] font-medium text-red-700 shrink-0 ml-2">
                      👎 {dish.dislikes.length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Dislike Form */}
          <form onSubmit={handleAddDislike} className="pt-2 border-t border-border-light flex gap-1.5">
            <input
              type="text"
              value={dislikeInput}
              onChange={(e) => setDislikeInput(e.target.value)}
              placeholder="Add a dish you dislike..."
              disabled={isAddingDislike}
              className="flex-1 min-w-0 bg-stone-50 border border-border focus:border-red-600 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-charcoal placeholder-charcoal-muted/60 focus:outline-none min-h-[38px]"
            />
            <button
              type="submit"
              disabled={!dislikeInput.trim() || isAddingDislike}
              className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs px-3 rounded-lg flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 min-h-[38px] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </section>

      {/* 3. Dashboard Button */}
      <section className="pt-2">
        <button
          type="button"
          onClick={onOpenDashboard}
          className="w-full bg-surface hover:bg-primary-soft hover:border-primary/40 border border-border rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-all shadow-subtle min-h-touch group"
        >
          <div>
            <span className="font-bold text-sm sm:text-base text-charcoal group-hover:text-primary transition-colors block">
              Dashboard
            </span>
            <span className="text-xs text-charcoal-muted mt-0.5 block">
              View all dishes, cast votes, and manage members
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-charcoal-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </button>
      </section>
    </div>
  );
};

