import React from 'react';
import type { Member } from '../types';
import {
  calculateMostLiked,
  calculateMostDisliked,
  calculateDishHarmony,
} from '../utils/preferenceCalculations';
import { Sparkles, ThumbsUp, ThumbsDown, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PreferenceSummaryProps {
  members: Member[];
}

export const PreferenceSummary: React.FC<PreferenceSummaryProps> = ({ members }) => {
  const mostLiked = calculateMostLiked(members);
  const mostDisliked = calculateMostDisliked(members);
  const harmony = calculateDishHarmony(members);

  const totalMembers = members.length;

  const safePicks = harmony.filter((h) => h.likeCount >= 2 && h.dislikeCount === 0);
  const conflictedDishes = harmony.filter((h) => h.likeCount > 0 && h.dislikeCount > 0);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (members.length === 0) {
    return (
      <section className="bg-surface rounded-2xl border border-border p-8 text-center text-charcoal-muted">
        <Sparkles className="w-8 h-8 text-charcoal-subtle mx-auto mb-2" />
        <p className="text-sm font-medium">Add members and dishes to see collective group preferences here.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Group Preferences & Insights
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
          Aggregated taste profile based on all {totalMembers} members
        </p>
      </div>

      {/* Main Grid: Most Liked & Commonly Disliked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Liked Card */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-light pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-charcoal text-base">Most Liked Curries & Dishes</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-like-bg text-like-text border border-like-border">
              {mostLiked.length} unique
            </span>
          </div>

          {mostLiked.length === 0 ? (
            <p className="text-xs sm:text-sm text-charcoal-subtle py-4 text-center italic">
              No likes recorded yet across members.
            </p>
          ) : (
            <div className="space-y-3">
              {mostLiked.slice(0, 6).map((item, idx) => {
                const percentage = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
                return (
                  <div key={item.dish} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 font-medium text-charcoal truncate">
                        <span className="text-base select-none">{getMedal(idx)}</span>
                        <span className="truncate font-semibold">{item.dish}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-charcoal-muted">
                        <span className="font-bold text-charcoal text-xs sm:text-sm">
                          {item.count} {item.count === 1 ? 'person' : 'people'}
                        </span>
                        <span className="text-[11px] text-charcoal-subtle">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>

                    {/* Member names list */}
                    <div className="text-[11px] text-charcoal-muted pl-6 truncate">
                      Loved by: {item.members.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Commonly Disliked Card */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-light pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-800">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-charcoal text-base">Commonly Disliked</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-dislike-bg text-dislike-text border border-dislike-border">
              {mostDisliked.length} unique
            </span>
          </div>

          {mostDisliked.length === 0 ? (
            <p className="text-xs sm:text-sm text-charcoal-subtle py-4 text-center italic">
              No dislikes recorded! Everyone is easy-going.
            </p>
          ) : (
            <div className="space-y-3">
              {mostDisliked.slice(0, 6).map((item) => {
                const percentage = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
                return (
                  <div key={item.dish} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 font-medium text-charcoal truncate">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate font-semibold">{item.dish}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-charcoal-muted">
                        <span className="font-bold text-charcoal text-xs sm:text-sm">
                          {item.count} {item.count === 1 ? 'person' : 'people'}
                        </span>
                        <span className="text-[11px] text-charcoal-subtle">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>

                    {/* Disliked by names */}
                    <div className="text-[11px] text-red-700/80 pl-6 truncate">
                      Disliked by: {item.members.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Crowd Pleasers / Harmony Callout */}
      {(safePicks.length > 0 || conflictedDishes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Safe Picks (Group Favorites) */}
          {safePicks.length > 0 && (
            <div className="bg-primary-soft/50 rounded-xl border border-primary/20 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Safe Picks (0 Dislikes)
                </h4>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Great choices for shared meals with no conflicts:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {safePicks.map((sp) => (
                    <span
                      key={sp.dish}
                      className="px-2 py-0.5 bg-surface rounded-md border border-primary/20 text-xs font-semibold text-primary"
                    >
                      {sp.dish} ({sp.likeCount} likes)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conflicted Dishes */}
          {conflictedDishes.length > 0 && (
            <div className="bg-accent-soft/60 rounded-xl border border-accent/30 p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Mixed Preferences (Check Before Cooking)
                </h4>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Liked by some but avoided by others:
                </p>
                <div className="space-y-1 mt-2">
                  {conflictedDishes.slice(0, 3).map((cd) => (
                    <div key={cd.dish} className="text-xs text-charcoal">
                      <span className="font-semibold">{cd.dish}</span>: {cd.likedBy.join(', ')} (👍) vs{' '}
                      <span className="text-red-700 font-medium">{cd.dislikedBy.join(', ')}</span> (👎)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
