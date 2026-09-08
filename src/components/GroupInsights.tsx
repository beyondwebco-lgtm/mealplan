import React from 'react';
import type { Dish, Member } from '../types';
import { Trophy, Flame, Ban } from 'lucide-react';

interface GroupInsightsProps {
  dishes: Dish[];
  members: Member[];
}

export const GroupInsights: React.FC<GroupInsightsProps> = ({ dishes, members }) => {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // 1. Most Liked Dishes (sorted descending by like count, where likes > 0)
  const mostLiked = [...dishes]
    .filter((d) => d.likes.length > 0)
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, 5);

  // 2. Popular Ideas (positive consensus: likes >= 1 and 0 dislikes)
  const popularIdeas = [...dishes]
    .filter((d) => d.likes.length > 0 && d.dislikes.length === 0)
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, 5);

  // 3. Things People Don't Like (dishes with dislikes > 0)
  const dislikedDishes = [...dishes]
    .filter((d) => d.dislikes.length > 0)
    .sort((a, b) => b.dislikes.length - a.dislikes.length);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Most Liked */}
      <div className="bg-surface rounded-2xl border border-emerald-200/70 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Trophy className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-charcoal text-base">What Everyone Likes</h4>
          </div>

          {mostLiked.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic">No liked dishes yet.</p>
          ) : (
            <div className="space-y-2">
              {mostLiked.map((dish, idx) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-border-light last:border-0"
                >
                  <span className="font-semibold text-charcoal truncate">
                    {idx + 1}. {dish.name}
                  </span>
                  <span className="font-bold text-emerald-700 shrink-0 ml-2 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ❤️ {dish.likes.length} {dish.likes.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Popular Ideas */}
      <div className="bg-surface rounded-2xl border border-amber-200/70 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Flame className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-charcoal text-base">Popular Ideas</h4>
          </div>

          {popularIdeas.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic">No zero-conflict favorites yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {popularIdeas.map((dish) => (
                <span
                  key={dish.id}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
                >
                  {dish.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Things People Don't Like */}
      <div className="bg-surface rounded-2xl border border-red-200/70 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <Ban className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-charcoal text-base">Things People Don&apos;t Like</h4>
          </div>

          {dislikedDishes.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic">No dishes marked as disliked!</p>
          ) : (
            <div className="space-y-1.5">
              {dislikedDishes.map((dish) => {
                const avoiders = dish.dislikes
                  .map((id) => memberMap.get(id)?.name)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-border-light last:border-0"
                  >
                    <span className="font-medium text-red-900 truncate">
                      • {dish.name}
                    </span>
                    {avoiders && (
                      <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 shrink-0 ml-2">
                        {avoiders}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
