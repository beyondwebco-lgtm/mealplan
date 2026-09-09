import React from 'react';
import type { Dish, Member } from '../types';

interface GroupInsightsProps {
  dishes: Dish[];
  members: Member[];
}

export const GroupInsights: React.FC<GroupInsightsProps> = ({ dishes, members }) => {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Dishes with most likes (at least 2 likes or >= 1 like if list is short), sorted desc
  const everyoneLikes = [...dishes]
    .filter((d) => d.likes.length >= 2 && d.dislikes.length === 0)
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, 5);

  // Fallback if none have >=2 likes
  const topLiked = everyoneLikes.length > 0
    ? everyoneLikes
    : [...dishes]
        .filter((d) => d.likes.length > 0)
        .sort((a, b) => b.likes.length - a.likes.length)
        .slice(0, 4);

  // Dishes with dislikes
  const notEveryoneLikes = [...dishes]
    .filter((d) => d.dislikes.length > 0)
    .sort((a, b) => b.dislikes.length - a.dislikes.length)
    .slice(0, 5);

  if (topLiked.length === 0 && notEveryoneLikes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Everyone Likes */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-2.5 shadow-subtle">
          <h3 className="text-sm font-bold text-charcoal flex items-center gap-1.5">
            <span>Everyone Likes</span>
          </h3>

          {topLiked.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic">No favorites yet.</p>
          ) : (
            <div className="space-y-1.5">
              {topLiked.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between text-xs py-1 text-charcoal border-b border-border-light last:border-0"
                >
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="text-emerald-700">❤️</span>
                    <span>{dish.name}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-charcoal-muted">
                    {dish.likes.length} {dish.likes.length === 1 ? 'like' : 'likes'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Not Everyone Likes */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-2.5 shadow-subtle">
          <h3 className="text-sm font-bold text-charcoal flex items-center gap-1.5">
            <span>Not Everyone Likes</span>
          </h3>

          {notEveryoneLikes.length === 0 ? (
            <p className="text-xs text-charcoal-muted italic">No dishes marked to avoid.</p>
          ) : (
            <div className="space-y-1.5">
              {notEveryoneLikes.map((dish) => {
                const avoiders = dish.dislikes
                  .map((id) => memberMap.get(id)?.name)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between text-xs py-1 text-charcoal border-b border-border-light last:border-0"
                  >
                    <span className="font-medium text-charcoal truncate">
                      • {dish.name}
                    </span>
                    {avoiders && (
                      <span className="text-[11px] text-red-700 font-medium shrink-0 ml-2">
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

