import React, { useState } from 'react';
import type { Dish, Member } from '../types';
import { Heart, ThumbsDown, Trash2, Search } from 'lucide-react';

interface DishFeedProps {
  dishes: Dish[];
  members: Member[];
  activeMemberId: string;
  onToggleLike: (dishId: string) => void;
  onToggleDislike: (dishId: string) => void;
  onDeleteDish: (dishId: string) => void;
}

const DISH_EMOJIS: Record<string, string> = {
  paneer: '🥘',
  dosa: '🥞',
  idli: '🥣',
  biryani: '🍚',
  dal: '🍲',
  upma: '🥣',
  chicken: '🍗',
  curry: '🍛',
  poori: '🫓',
  puri: '🫓',
  chapati: '🫓',
  roti: '🫓',
  rice: '🍚',
  fish: '🐟',
  salad: '🥗',
  egg: '🍳',
};

function getDishEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(DISH_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

export const DishFeed: React.FC<DishFeedProps> = ({
  dishes,
  members,
  activeMemberId,
  onToggleLike,
  onToggleDislike,
  onDeleteDish,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'liked' | 'my-suggestions'>('all');

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const filteredDishes = dishes.filter((dish) => {
    const q = search.toLowerCase();
    const matchSearch =
      dish.name.toLowerCase().includes(q) ||
      dish.suggestedBy.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filter === 'liked') {
      return dish.likes.length > 0;
    }
    if (filter === 'my-suggestions') {
      return (
        dish.suggestedByMemberId === activeMemberId ||
        dish.suggestedBy.toLowerCase() === (memberMap.get(activeMemberId)?.name.toLowerCase() || '')
      );
    }
    return true;
  });

  return (
    <section className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl sm:text-2xl font-bold text-charcoal flex items-center gap-2">
            Dish Ideas
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
              {dishes.length}
            </span>
          </h3>
        </div>

        {/* Search & Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes or members..."
              className="text-xs pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:border-primary w-48 sm:w-56"
            />
          </div>

          <div className="flex items-center bg-background border border-border p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-surface text-charcoal font-bold shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('liked')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === 'liked'
                  ? 'bg-surface text-charcoal font-bold shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              ❤️ Liked
            </button>
            <button
              type="button"
              onClick={() => setFilter('my-suggestions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === 'my-suggestions'
                  ? 'bg-surface text-charcoal font-bold shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              My Ideas
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {dishes.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border-dark p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-soft flex items-center justify-center text-primary text-xl">
            🍲
          </div>
          <h4 className="font-bold text-charcoal text-base">No dish ideas added yet!</h4>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            Use the box above to suggest your favorite curries, breakfasts, or dinner cravings.
          </p>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center text-sm text-charcoal-muted">
          No dishes match &ldquo;{search}&rdquo;.
        </div>
      ) : (
        /* Dishes List Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredDishes.map((dish) => {
            const isLikedByMe = dish.likes.includes(activeMemberId);
            const isDislikedByMe = dish.dislikes.includes(activeMemberId);
            const emoji = getDishEmoji(dish.name);

            // Names of likers & dislikers
            const likerNames = dish.likes
              .map((id) => memberMap.get(id)?.name)
              .filter(Boolean) as string[];

            const dislikerNames = dish.dislikes
              .map((id) => memberMap.get(id)?.name)
              .filter(Boolean) as string[];

            return (
              <div
                key={dish.id}
                className={`bg-surface rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-card ${
                  isLikedByMe
                    ? 'border-emerald-300 ring-1 ring-emerald-200/60'
                    : isDislikedByMe
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-border hover:border-border-dark'
                }`}
              >
                <div>
                  {/* Top Bar: Icon + Delete Action */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">{emoji}</span>

                    <button
                      type="button"
                      onClick={() => onDeleteDish(dish.id)}
                      className="p-1.5 text-charcoal-muted/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={`Remove "${dish.name}"`}
                      aria-label={`Delete ${dish.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dish Name */}
                  <h4 className="font-bold text-charcoal text-base sm:text-lg mt-2 leading-snug">
                    {dish.name}
                  </h4>

                  {/* Suggester Subtitle */}
                  <p className="text-xs text-charcoal-muted mt-1 flex items-center gap-1.5">
                    <span>Suggested by</span>
                    <span className="font-semibold text-charcoal">
                      {dish.suggestedBy}
                    </span>
                  </p>

                  {/* Likers / Dislikers pills */}
                  {(likerNames.length > 0 || dislikerNames.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      {likerNames.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                          title={`Liked by: ${likerNames.join(', ')}`}
                        >
                          <Heart className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          <span>{likerNames.join(', ')}</span>
                        </span>
                      )}

                      {dislikerNames.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200"
                          title={`Disliked by: ${dislikerNames.join(', ')}`}
                        >
                          <ThumbsDown className="w-3 h-3 text-red-500" />
                          <span>Avoid: {dislikerNames.join(', ')}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons: Like & Dislike */}
                <div className="pt-4 mt-3 border-t border-border-light flex items-center gap-2">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => onToggleLike(dish.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      isLikedByMe
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-background hover:bg-emerald-50 text-charcoal border border-border hover:border-emerald-300'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLikedByMe ? 'fill-white text-white' : 'text-emerald-600'
                      }`}
                    />
                    <span>Like</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isLikedByMe ? 'bg-emerald-700 text-white' : 'bg-border-light text-charcoal'
                      }`}
                    >
                      {dish.likes.length}
                    </span>
                  </button>

                  {/* Don't Like Button */}
                  <button
                    type="button"
                    onClick={() => onToggleDislike(dish.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      isDislikedByMe
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-background hover:bg-red-50 text-charcoal border border-border hover:border-red-300'
                    }`}
                  >
                    <ThumbsDown
                      className={`w-3.5 h-3.5 ${
                        isDislikedByMe ? 'text-white' : 'text-red-500'
                      }`}
                    />
                    <span>Don&apos;t Like</span>
                    {dish.dislikes.length > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isDislikedByMe ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dish.dislikes.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
