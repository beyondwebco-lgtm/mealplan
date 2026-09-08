import React, { useState } from 'react';
import type { DayKey, MealSlot } from '../types';
import { Coffee, Sun, Moon, Check, X } from 'lucide-react';

interface MealDayCardProps {
  dayKey: DayKey;
  dayLabel: string;
  isToday?: boolean;
  mealSlot: MealSlot;
  likedSuggestions: string[];
  onChangeMeal: (dayKey: DayKey, mealType: keyof MealSlot, value: string) => void;
}

export const MealDayCard: React.FC<MealDayCardProps> = ({
  dayKey,
  dayLabel,
  isToday = false,
  mealSlot,
  likedSuggestions,
  onChangeMeal,
}) => {
  const [activeSlot, setActiveSlot] = useState<keyof MealSlot | null>(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (slot: keyof MealSlot) => {
    setActiveSlot(slot);
    setTempValue(mealSlot[slot] || '');
  };

  const saveEdit = (slot: keyof MealSlot) => {
    onChangeMeal(dayKey, slot, tempValue.trim());
    setActiveSlot(null);
  };

  const cancelEdit = () => {
    setActiveSlot(null);
    setTempValue('');
  };

  const handleSuggestionClick = (slot: keyof MealSlot, suggestion: string) => {
    const current = mealSlot[slot];
    const updated = current ? `${current} + ${suggestion}` : suggestion;
    onChangeMeal(dayKey, slot, updated);
  };

  return (
    <div
      className={`bg-surface rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-card ${
        isToday ? 'border-primary ring-1 ring-primary/30' : 'border-border'
      }`}
    >
      {/* Day Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isToday ? 'bg-primary-soft/60 border-primary/20' : 'bg-background/60 border-border-light'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-charcoal text-sm sm:text-base">{dayLabel}</span>
          {isToday && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary text-white">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Meal Slots */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Breakfast */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-charcoal-muted uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-3 h-3 text-amber-600" /> Breakfast
            </span>
            {activeSlot !== 'breakfast' && (
              <button
                type="button"
                onClick={() => startEdit('breakfast')}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                {mealSlot.breakfast ? 'Edit' : '+ Add'}
              </button>
            )}
          </div>

          {activeSlot === 'breakfast' ? (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit('breakfast');
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  placeholder="e.g. Idli & Sambar"
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full bg-surface"
                />
                <button
                  type="button"
                  onClick={() => saveEdit('breakfast')}
                  className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover"
                  title="Save"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => startEdit('breakfast')}
              className={`text-xs p-2 rounded-lg border border-transparent hover:border-border-dark cursor-pointer transition-colors ${
                mealSlot.breakfast
                  ? 'bg-background font-medium text-charcoal'
                  : 'bg-background/40 text-charcoal-subtle italic'
              }`}
            >
              {mealSlot.breakfast || 'Not planned yet'}
            </div>
          )}
        </div>

        {/* Lunch */}
        <div className="space-y-1 pt-2 border-t border-border-light">
          <div className="flex items-center justify-between text-[11px] font-bold text-charcoal-muted uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-amber-500" /> Lunch
            </span>
            {activeSlot !== 'lunch' && (
              <button
                type="button"
                onClick={() => startEdit('lunch')}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                {mealSlot.lunch ? 'Edit' : '+ Add'}
              </button>
            )}
          </div>

          {activeSlot === 'lunch' ? (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit('lunch');
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  placeholder="e.g. Dal Tadka + Rice"
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full bg-surface"
                />
                <button
                  type="button"
                  onClick={() => saveEdit('lunch')}
                  className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => startEdit('lunch')}
              className={`text-xs p-2 rounded-lg border border-transparent hover:border-border-dark cursor-pointer transition-colors ${
                mealSlot.lunch
                  ? 'bg-background font-medium text-charcoal'
                  : 'bg-background/40 text-charcoal-subtle italic'
              }`}
            >
              {mealSlot.lunch || 'Not planned yet'}
            </div>
          )}
        </div>

        {/* Dinner */}
        <div className="space-y-1 pt-2 border-t border-border-light">
          <div className="flex items-center justify-between text-[11px] font-bold text-charcoal-muted uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Moon className="w-3 h-3 text-indigo-500" /> Dinner
            </span>
            {activeSlot !== 'dinner' && (
              <button
                type="button"
                onClick={() => startEdit('dinner')}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                {mealSlot.dinner ? 'Edit' : '+ Add'}
              </button>
            )}
          </div>

          {activeSlot === 'dinner' ? (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit('dinner');
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  placeholder="e.g. Paneer Butter Masala + Roti"
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full bg-surface"
                />
                <button
                  type="button"
                  onClick={() => saveEdit('dinner')}
                  className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => startEdit('dinner')}
              className={`text-xs p-2 rounded-lg border border-transparent hover:border-border-dark cursor-pointer transition-colors ${
                mealSlot.dinner
                  ? 'bg-background font-medium text-charcoal'
                  : 'bg-background/40 text-charcoal-subtle italic'
              }`}
            >
              {mealSlot.dinner || 'Not planned yet'}
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips if active slot is open */}
        {activeSlot && likedSuggestions.length > 0 && (
          <div className="pt-2 border-t border-dashed border-border text-[11px]">
            <span className="text-charcoal-muted block mb-1">Pick from group likes:</span>
            <div className="flex flex-wrap gap-1">
              {likedSuggestions.slice(0, 4).map((dish) => (
                <button
                  key={dish}
                  type="button"
                  onClick={() => handleSuggestionClick(activeSlot, dish)}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] hover:bg-emerald-100 transition-colors"
                >
                  + {dish}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
