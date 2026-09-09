import React, { useState } from 'react';
import type { Dish } from '../types';
import { Heart, ThumbsDown, Trash2 } from 'lucide-react';

interface DishFeedProps {
  dishes: Dish[];
  activeMemberId: string;
  onToggleLike: (dishId: string, targetMemberId?: string) => void;
  onToggleDislike: (dishId: string, targetMemberId?: string) => void;
  onDeleteDish: (dishId: string) => void;
}

export const DishFeed: React.FC<DishFeedProps> = ({
  dishes,
  activeMemberId,
  onToggleLike,
  onToggleDislike,
  onDeleteDish,
}) => {
  const [filter, setFilter] = useState<'all' | 'liked'>('all');

  const filteredDishes = dishes.filter((dish) => {
    if (filter === 'liked') return dish.likes.length > 0;
    return true;
  });

  return (
    <section id="ideas-section" className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-lg sm:text-xl font-bold text-charcoal">
          Dish Ideas
        </h2>

        {/* Minimal filter */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-charcoal text-white font-semibold'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            All ({dishes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('liked')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'liked'
                ? 'bg-charcoal text-white font-semibold'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            ❤️ Liked
          </button>
        </div>
      </div>

      {/* Empty State */}
      {dishes.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center space-y-1">
          <p className="font-semibold text-charcoal text-sm">No dish ideas yet</p>
          <p className="text-xs text-charcoal-muted">
            Add a meal or curry idea above to get started.
          </p>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-6 text-center text-xs text-charcoal-muted">
          No liked dishes found.
        </div>
      ) : (
        /* Clean List */
        <div className="space-y-2.5">
          {filteredDishes.map((dish) => {
            const isLikedByMe = dish.likes.includes(activeMemberId);
            const isDislikedByMe = dish.dislikes.includes(activeMemberId);

            return (
              <div
                key={dish.id}
                className="bg-surface rounded-xl border border-border p-3.5 sm:p-4 space-y-3 shadow-subtle"
              >
                {/* Top Row: Dish Name & Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-charcoal text-base sm:text-lg leading-tight">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      Suggested by <span className="font-medium text-charcoal">{dish.suggestedBy}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteDish(dish.id)}
                    className="p-1.5 text-charcoal-subtle hover:text-red-600 transition-colors rounded-lg"
                    title={`Delete "${dish.name}"`}
                    aria-label={`Delete ${dish.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Counter & Action Row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-light">
                  {/* Subtle vote counters */}
                  <div className="flex items-center gap-3 text-xs font-medium text-charcoal-muted">
                    <span className="flex items-center gap-1">
                      <Heart className={`w-3.5 h-3.5 ${dish.likes.length > 0 ? 'text-emerald-700 fill-emerald-700' : 'text-charcoal-subtle'}`} />
                      <span className={dish.likes.length > 0 ? 'font-semibold text-charcoal' : ''}>
                        {dish.likes.length}
                      </span>
                    </span>

                    {dish.dislikes.length > 0 && (
                      <span className="flex items-center gap-1 text-red-700 font-medium">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{dish.dislikes.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Touch-friendly Like / Don't like buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => onToggleLike(dish.id)}
                      className={`min-h-touch px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLikedByMe
                          ? 'bg-primary text-white'
                          : 'bg-background hover:bg-primary-soft text-charcoal border border-border'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-white' : 'text-primary'}`} />
                      <span>{isLikedByMe ? 'Liked' : 'Like'}</span>
                    </button>

                    {/* Don't like button */}
                    <button
                      type="button"
                      onClick={() => onToggleDislike(dish.id)}
                      className={`min-h-touch px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isDislikedByMe
                          ? 'bg-dislike-bg text-dislike-text border border-dislike-border'
                          : 'bg-background hover:bg-red-50 text-charcoal-muted hover:text-dislike-text border border-border'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Don&apos;t like</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

