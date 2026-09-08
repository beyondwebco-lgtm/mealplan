import React, { useState } from 'react';
import type { Group, DayKey, MealSlot } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  Loader2,
  Clock,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Utensils,
  Lightbulb,
  Heart,
} from 'lucide-react';

interface MealIdeaPromptProps {
  activeGroup: Group;
  onUpdateMealPlan?: (dayKey: DayKey, mealType: keyof MealSlot, value: string) => void;
  onAddLike?: (memberId: string, dish: string) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface MealIdeaItem {
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'any';
  description: string;
  matchReason: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  quickSteps?: string[];
}

const SAMPLE_CHIPS = [
  '🍛 Paneer & Veg Curries',
  '🍲 Quick Dal Varieties',
  '🥗 High-Protein Lunch',
  '⚡ 15-Min Quick Dinners',
  '🥞 Weekend Breakfast',
  '🍚 Biryani & Rice Dishes',
];

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export const MealIdeaPrompt: React.FC<MealIdeaPromptProps> = ({
  activeGroup,
  onUpdateMealPlan,
  onAddLike,
  showToast,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ideas, setIdeas] = useState<MealIdeaItem[]>([]);
  const [expandedStepsIndex, setExpandedStepsIndex] = useState<number | null>(null);

  // Scheduling mini-dialog state
  const [schedulingDishIndex, setSchedulingDishIndex] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [selectedSlot, setSelectedSlot] = useState<keyof MealSlot>('dinner');

  // Add like to member mini-dialog state
  const [likingDishIndex, setLikingDishIndex] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeGroup.members[0]?.id || '');

  const handleGenerate = async (promptText?: string) => {
    const text = (promptText !== undefined ? promptText : query).trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setIdeas([]);
    setSchedulingDishIndex(null);
    setLikingDishIndex(null);

    const customKey = localStorage.getItem('mealplan_gemini_custom_api_key') || undefined;
    const useCustom = localStorage.getItem('mealplan_gemini_use_custom_key') === 'true';
    const keyToUse = useCustom && customKey ? customKey : undefined;

    try {
      showToast?.(`Chef Gemini is crafting ideas for "${text}"...`, 'info');
      const results = await api.suggestMealIdeas(text, activeGroup.members, keyToUse);
      if (Array.isArray(results) && results.length > 0) {
        setIdeas(results);
        showToast?.(`Generated ${results.length} dish ideas tailored to your group!`, 'success');
      } else {
        showToast?.('No specific recipes returned, try tweaking your query', 'warning');
      }
    } catch (err: any) {
      console.error('Meal Idea generation error:', err);
      showToast?.(`Idea generation error: ${err.message || 'Could not reach AI'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMeal = (dishTitle: string) => {
    if (!onUpdateMealPlan) return;
    onUpdateMealPlan(selectedDay, selectedSlot, dishTitle);
    showToast?.(`Scheduled "${dishTitle}" for ${selectedDay.toUpperCase()} ${selectedSlot}!`, 'success');
    setSchedulingDishIndex(null);
  };

  const handleAddMemberLike = (dishTitle: string) => {
    if (!onAddLike || !selectedMemberId) return;
    const member = activeGroup.members.find((m) => m.id === selectedMemberId);
    onAddLike(selectedMemberId, dishTitle);
    showToast?.(`Added "${dishTitle}" to ${member?.name || 'member'}'s likes!`, 'success');
    setLikingDishIndex(null);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-subtle p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary text-white">
              <Lightbulb className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-charcoal flex items-center gap-1.5">
              AI Meal & Dish Idea Finder
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Type any craving, lunch, dinner idea, curries, or ingredients you have at home:
          </p>
        </div>

        {ideas.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIdeas([]);
              setQuery('');
            }}
            className="text-xs text-charcoal-muted hover:text-charcoal px-3 py-1.5 rounded-lg bg-background border border-border hover:border-border-dark self-start sm:self-auto transition-colors"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Main Idea Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your idea: lunch, dinner ideas, curries, ingredients you have..."
            disabled={isLoading}
            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal-muted/70 focus:outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Ideas...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Get AI Suggestions</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-[11px] font-semibold text-charcoal-muted mr-1">Quick ideas:</span>
        {SAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isLoading}
            onClick={() => {
              const cleaned = chip.replace(/^[^\w\s]+\s*/, '');
              setQuery(cleaned);
              handleGenerate(cleaned);
            }}
            className="px-2.5 py-1 rounded-lg bg-background hover:bg-primary-soft/50 border border-border hover:border-primary/40 text-charcoal text-[11px] font-medium transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* GENERATED IDEAS DISPLAY CARDS */}
      {ideas.length > 0 && (
        <div className="pt-3 border-t border-border-light space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" />
              Chef Gemini Recommended {ideas.length} Dishes for {activeGroup.name}:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-background rounded-xl border border-border hover:border-primary/40 p-4 flex flex-col justify-between shadow-subtle hover:shadow-card transition-all space-y-3"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-primary-soft text-primary font-bold text-[10px] uppercase tracking-wider">
                      {idea.mealType || 'Meal'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-charcoal-muted">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{idea.prepTime} prep • {idea.cookTime} cook</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-bold text-base text-charcoal leading-snug">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
                    {idea.description}
                  </p>

                  {/* Match Reason */}
                  {idea.matchReason && (
                    <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                      ✨ {idea.matchReason}
                    </div>
                  )}

                  {/* Key Ingredients */}
                  {idea.ingredients && idea.ingredients.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {idea.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-surface text-[10px] text-charcoal font-medium rounded border border-border"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expandable Recipe Steps */}
                  {idea.quickSteps && idea.quickSteps.length > 0 && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStepsIndex((prev) => (prev === idx ? null : idx))
                        }
                        className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {expandedStepsIndex === idx ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Hide Preparation Steps
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> View Preparation Steps
                          </>
                        )}
                      </button>

                      {expandedStepsIndex === idx && (
                        <div className="mt-2 bg-surface p-2.5 rounded-lg border border-border text-[11px] space-y-1 text-charcoal animate-in fade-in duration-150">
                          <span className="font-semibold block mb-1">Quick Steps:</span>
                          {idea.quickSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-1.5">
                              <span className="font-bold text-primary">{sIdx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-border-light space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* Add to Schedule Button */}
                    {onUpdateMealPlan && (
                      <button
                        type="button"
                        onClick={() => {
                          setSchedulingDishIndex((prev) => (prev === idx ? null : idx));
                          setLikingDishIndex(null);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                          schedulingDishIndex === idx
                            ? 'bg-primary text-white'
                            : 'bg-primary-soft hover:bg-emerald-100 text-primary'
                        }`}
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </button>
                    )}

                    {/* Add to Member Likes Button */}
                    {onAddLike && activeGroup.members.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setLikingDishIndex((prev) => (prev === idx ? null : idx));
                          setSchedulingDishIndex(null);
                        }}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          likingDishIndex === idx
                            ? 'bg-emerald-700 text-white'
                            : 'bg-surface hover:bg-border-light text-charcoal border border-border'
                        }`}
                        title="Add dish to a member's likes"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Like</span>
                      </button>
                    )}
                  </div>

                  {/* Mini-modal: Select Day and Slot to schedule */}
                  {schedulingDishIndex === idx && (
                    <div className="bg-surface p-2.5 rounded-lg border border-primary/30 space-y-2 animate-in fade-in duration-150 text-xs">
                      <span className="font-semibold text-charcoal block">
                        Schedule &quot;{idea.title}&quot; to:
                      </span>
                      <div className="flex gap-1.5">
                        <select
                          value={selectedDay}
                          onChange={(e) => setSelectedDay(e.target.value as DayKey)}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-medium text-charcoal"
                        >
                          {DAYS.map((d) => (
                            <option key={d.key} value={d.key}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedSlot}
                          onChange={(e) => setSelectedSlot(e.target.value as keyof MealSlot)}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-medium text-charcoal"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleScheduleMeal(idea.title)}
                          className="px-2.5 py-1 bg-primary text-white font-semibold rounded hover:bg-primary-hover flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mini-modal: Select Member to like */}
                  {likingDishIndex === idx && (
                    <div className="bg-surface p-2.5 rounded-lg border border-primary/30 space-y-2 animate-in fade-in duration-150 text-xs">
                      <span className="font-semibold text-charcoal block">
                        Add to member favorites:
                      </span>
                      <div className="flex gap-1.5">
                        <select
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-medium text-charcoal"
                        >
                          {activeGroup.members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAddMemberLike(idea.title)}
                          className="px-3 py-1 bg-emerald-700 text-white font-semibold rounded hover:bg-emerald-800 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
