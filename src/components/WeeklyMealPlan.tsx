import React from 'react';
import type { DayKey, Member, WeeklyMealPlan as WeeklyMealPlanType, MealSlot } from '../types';
import { MealDayCard } from './MealDayCard';
import { Calendar, Trash2, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { calculateMostLiked } from '../utils/preferenceCalculations';

interface WeeklyMealPlanProps {
  mealPlan: WeeklyMealPlanType;
  members: Member[];
  onChangeMeal: (dayKey: DayKey, mealType: keyof MealSlot, value: string) => void;
  onClearPlan: () => void;
  onGenerateAIPlan?: () => void;
  isGeneratingAIPlan?: boolean;
}

const DAYS: { key: DayKey; label: string; dayIndex: number }[] = [
  { key: 'monday', label: 'Monday', dayIndex: 1 },
  { key: 'tuesday', label: 'Tuesday', dayIndex: 2 },
  { key: 'wednesday', label: 'Wednesday', dayIndex: 3 },
  { key: 'thursday', label: 'Thursday', dayIndex: 4 },
  { key: 'friday', label: 'Friday', dayIndex: 5 },
  { key: 'saturday', label: 'Saturday', dayIndex: 6 },
  { key: 'sunday', label: 'Sunday', dayIndex: 0 },
];

export const WeeklyMealPlan: React.FC<WeeklyMealPlanProps> = ({
  mealPlan,
  members,
  onChangeMeal,
  onClearPlan,
  onGenerateAIPlan,
  isGeneratingAIPlan = false,
}) => {
  const currentDayIndex = new Date().getDay();
  const mostLikedDishes = calculateMostLiked(members).map((d) => d.dish);

  let plannedCount = 0;
  DAYS.forEach(({ key }) => {
    const day = mealPlan[key];
    if (day.breakfast) plannedCount++;
    if (day.lunch) plannedCount++;
    if (day.dinner) plannedCount++;
  });
  const totalSlots = 21;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Weekly Meal Plan
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {plannedCount}/{totalSlots} planned
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Coordinate breakfast, lunch, and dinner using your group&apos;s collective favorites
          </p>
        </div>

        {/* AI Auto-Plan & Clear Actions */}
        <div className="flex items-center gap-2">
          {onGenerateAIPlan && (
            <button
              type="button"
              disabled={isGeneratingAIPlan}
              onClick={onGenerateAIPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Generate 7-day meal plan based on likes and avoiding dislikes"
            >
              {isGeneratingAIPlan ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Generating Plan...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Auto-Plan Week</span>
                </>
              )}
            </button>
          )}

          {plannedCount > 0 && (
            <button
              type="button"
              onClick={onClearPlan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-charcoal-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all meals from plan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Dishes Bar */}
      {mostLikedDishes.length > 0 && (
        <div className="bg-primary-soft/40 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-primary flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Group Favorites to Plan:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {mostLikedDishes.slice(0, 6).map((dish) => (
              <span
                key={dish}
                className="px-2 py-0.5 bg-surface rounded-full border border-primary/20 text-charcoal font-medium text-[11px]"
              >
                {dish}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
        {DAYS.map(({ key, label, dayIndex }) => (
          <MealDayCard
            key={key}
            dayKey={key}
            dayLabel={label}
            isToday={dayIndex === currentDayIndex}
            mealSlot={mealPlan[key] || { breakfast: '', lunch: '', dinner: '' }}
            likedSuggestions={mostLikedDishes}
            onChangeMeal={onChangeMeal}
          />
        ))}
      </div>
    </section>
  );
};
