import React from 'react';
import { Users, Heart, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface HeroLandingProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onExploreDashboard: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onOpenCreateGroup,
  onOpenJoinGroup,
  onExploreDashboard,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-6 sm:pt-12 max-w-3xl mx-auto">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft text-primary border border-primary/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Collaborative Meal Planning Made Effortless</span>
        </div>

        {/* Main Headings */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-charcoal tracking-tight">
            Plan Meals <span className="text-primary underline decoration-accent/60 decoration-wavy decoration-2">Together</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-charcoal/80">
            Everyone&apos;s preferences. One shared meal plan.
          </p>
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Tell us what you love, what you dislike, and build meals that work for everyone. No more dinner arguments or wondering what everyone wants to eat.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary-hover text-white text-base font-bold rounded-xl shadow-card hover:shadow-card-hover transition-all active:scale-95"
          >
            <span>Create Meal Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenJoinGroup}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface hover:bg-background text-charcoal border border-border text-base font-semibold rounded-xl shadow-subtle transition-colors"
          >
            <span>Join Meal Plan</span>
          </button>
          <button
            type="button"
            onClick={onExploreDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3.5 text-primary hover:underline text-sm font-semibold transition-colors"
          >
            <span>Explore Live Demo Dashboard &rarr;</span>
          </button>
        </div>
      </div>

      {/* 3-Step Value Proposition Cards */}
      <div className="pt-16 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-xs uppercase font-bold tracking-widest text-charcoal-muted">
            How It Works
          </h2>
          <p className="text-lg font-bold text-charcoal mt-1">Simple collaborative flow in 3 steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle hover:shadow-card transition-all space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary font-extrabold text-sm flex items-center justify-center">
              01
            </div>
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Add Everyone
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Add the people participating in the meal plan—roommates, family members, or dinner guests.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle hover:shadow-card transition-all space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center">
              02
            </div>
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600" />
              Share Preferences
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Everyone adds the curries and dishes they love or prefer to avoid with simple instant chips.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle hover:shadow-card transition-all space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-amber-900 font-extrabold text-sm flex items-center justify-center">
              03
            </div>
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Plan Together
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Use aggregated group insights and favorite dishes to map out a stress-free weekly meal plan.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="border-t border-border-light pt-6 text-center text-xs text-charcoal-muted">
        MealTogether MVP — Collaborative Meal Planning Application
      </div>
    </div>
  );
};
