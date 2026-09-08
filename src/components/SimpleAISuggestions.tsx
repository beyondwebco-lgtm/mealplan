import React, { useState } from 'react';
import type { Dish, Member } from '../types';
import { api } from '../services/api';
import { Sparkles, Loader2, Plus, Check, RefreshCw } from 'lucide-react';

interface SimpleAISuggestionsProps {
  dishes: Dish[];
  members: Member[];
  activeMemberId: string;
  onAddDish: (name: string, suggestedBy: string, suggestedByMemberId?: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface Suggestion {
  title: string;
  description: string;
  matchReason: string;
}

const QUICK_PROMPTS = [
  '⚡ Quick 15-min dinner ideas',
  '🥞 Weekend breakfast ideas',
  '🍛 High-protein curries',
  '🥗 Light healthy lunch',
  '🍲 Comforting rice & dal combos',
];

export const SimpleAISuggestions: React.FC<SimpleAISuggestionsProps> = ({
  dishes,
  members,
  activeMemberId,
  onAddDish,
  showToast,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());

  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  const handleFetchSuggestions = async (customPrompt?: string) => {
    const textToQuery = (customPrompt !== undefined ? customPrompt : prompt).trim() || 'Suggest 4-5 great dish ideas for our group';
    if (isLoading) return;

    setIsLoading(true);
    setSuggestions([]);
    setAddedTitles(new Set());

    // Build context from group state
    const existingDishes = dishes.map((d) => d.name);
    const popularLikes = dishes
      .filter((d) => d.likes.length > 0)
      .map((d) => d.name);

    const dislikedDishes = dishes
      .filter((d) => d.dislikes.length > 0)
      .map((d) => d.name);

    const memberSummaries = members.map((m) => ({
      name: m.name,
      likedDishes: dishes.filter((d) => d.likes.includes(m.id)).map((d) => d.name),
      dislikedDishes: dishes.filter((d) => d.dislikes.includes(m.id)).map((d) => d.name),
    }));

    try {
      showToast('Gemini is generating delicious meal ideas...', 'info');
      const results = await api.getAISuggestions(
        textToQuery,
        {
          existingDishes,
          popularLikes,
          dislikedDishes,
          members: memberSummaries,
        }
      );

      if (Array.isArray(results) && results.length > 0) {
        setSuggestions(results);
        showToast(`Chef Gemini suggested ${results.length} ideas!`, 'success');
      } else {
        showToast('No suggestions returned. Try another idea prompt.', 'warning');
      }
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      showToast(`AI suggestion error: ${err.message || 'Could not reach Gemini'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestionToBoard = async (item: Suggestion) => {
    try {
      await onAddDish(
        item.title,
        activeMember?.name ? `${activeMember.name} (via AI)` : 'AI Suggestion',
        activeMember?.id
      );
      setAddedTitles((prev) => new Set(prev).add(item.title));
      showToast(`Added "${item.title}" to the group board!`, 'success');
    } catch (err: any) {
      showToast(`Error adding dish: ${err.message}`, 'error');
    }
  };

  return (
    <section className="bg-surface rounded-2xl border border-border shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-charcoal">Need an idea?</h3>
            <p className="text-xs text-charcoal-muted">
              Ask Gemini to suggest dishes based on everyone&apos;s likes and dislikes.
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => handleFetchSuggestions()}
            disabled={isLoading}
            className="text-xs text-charcoal-muted hover:text-charcoal px-3 py-1.5 rounded-lg bg-background border border-border flex items-center gap-1 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        )}
      </div>

      {/* Input and Ask Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Suggest something for dinner, quick South Indian dishes, curries..."
          disabled={isLoading}
          className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => handleFetchSuggestions()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Suggest Dishes</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
        <span className="text-[11px] font-semibold text-charcoal-muted">Quick queries:</span>
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isLoading}
            onClick={() => {
              const cleaned = q.replace(/^[^\w\s]+\s*/, '');
              setPrompt(cleaned);
              handleFetchSuggestions(cleaned);
            }}
            className="px-2.5 py-1 rounded-lg bg-background hover:bg-amber-50 border border-border hover:border-amber-300 text-charcoal text-[11px] font-medium transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="pt-3 border-t border-border-light space-y-2.5 animate-in fade-in duration-200">
          <span className="text-xs font-bold text-amber-900 block">
            Here are {suggestions.length} dish ideas tailored to your group:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((item, idx) => {
              const isAdded = addedTitles.has(item.title);

              return (
                <div
                  key={idx}
                  className="bg-background rounded-xl border border-border p-3.5 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <h5 className="font-bold text-charcoal text-sm">
                      {idx + 1}. {item.title}
                    </h5>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      {item.description}
                    </p>
                    {item.matchReason && (
                      <span className="inline-block mt-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✨ {item.matchReason}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddSuggestionToBoard(item)}
                    className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      isAdded
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-primary-soft hover:bg-primary text-primary hover:text-white border border-primary/20'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added to Board</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add to Ideas</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
