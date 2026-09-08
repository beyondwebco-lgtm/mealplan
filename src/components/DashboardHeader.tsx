import React from 'react';
import type { Group } from '../types';
import { Users, Heart, ThumbsDown, Sparkles, Plus, PlusCircle, RotateCcw } from 'lucide-react';
import { calculateMostLiked } from '../utils/preferenceCalculations';

interface DashboardHeaderProps {
  group: Group;
  onOpenAddMember: () => void;
  onOpenCreateGroup: () => void;
  onResetData: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  group,
  onOpenAddMember,
  onOpenCreateGroup,
  onResetData,
}) => {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = group.creatorName || (group.members[0]?.name ?? 'Team');

  const totalLikes = group.members.reduce((acc, m) => acc + m.likes.length, 0);
  const totalDislikes = group.members.reduce((acc, m) => acc + m.dislikes.length, 0);
  const mostLikedList = calculateMostLiked(group.members);
  const topFavorite = mostLikedList.length > 0 ? mostLikedList[0].dish : 'None yet';

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle space-y-5">
      {/* Top row: Greeting & Group Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Meal Group
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight mt-1">
            {timeGreeting}, {userName} <span className="inline-block">👋</span>
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm text-charcoal-muted">
            <span className="font-semibold text-charcoal">{group.name}</span>
            <span>•</span>
            <span>{group.members.length} {group.members.length === 1 ? 'member' : 'members'} contributing</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-soft hover:bg-emerald-100 text-primary text-xs sm:text-sm font-medium rounded-xl transition-colors"
            title="Create another group"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Group</span>
          </button>
          <button
            type="button"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-charcoal-muted hover:text-charcoal hover:bg-border-light text-xs font-medium rounded-xl transition-colors"
            title="Reset to initial sample demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border-light">
        <div className="bg-background rounded-xl p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-soft flex items-center justify-center text-primary shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-charcoal leading-none">
              {group.members.length}
            </div>
            <div className="text-[11px] text-charcoal-muted font-medium mt-1">Group Members</div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-charcoal leading-none">
              {totalLikes}
            </div>
            <div className="text-[11px] text-charcoal-muted font-medium mt-1">Total Likes</div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <ThumbsDown className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-charcoal leading-none">
              {totalDislikes}
            </div>
            <div className="text-[11px] text-charcoal-muted font-medium mt-1">Total Dislikes</div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-3.5 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center text-accent shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-charcoal truncate leading-tight" title={topFavorite}>
              {topFavorite}
            </div>
            <div className="text-[11px] text-charcoal-muted font-medium mt-1">Top Favorite</div>
          </div>
        </div>
      </div>
    </div>
  );
};
