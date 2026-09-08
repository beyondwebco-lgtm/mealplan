import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState, Toast as ToastType } from './types';
import { sampleGroup, sampleMembers, sampleDishes } from './data/sampleData';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroDishInput } from './components/HeroDishInput';
import { DishFeed } from './components/DishFeed';
import { GroupInsights } from './components/GroupInsights';
import { MembersSection } from './components/MembersSection';
import { SimpleAISuggestions } from './components/SimpleAISuggestions';
import { ToastContainer } from './components/Toast';
import { Loader2, Database, AlertCircle } from 'lucide-react';

const FALLBACK_STATE: AppState = {
  group: sampleGroup,
  members: sampleMembers,
  dishes: sampleDishes,
};

export function App() {
  const [appState, setAppState] = useState<AppState>(FALLBACK_STATE);
  const [activeMemberId, setActiveMemberId] = useState<string>('member-maneesh');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Reference for scrolling to members section
  const membersSectionRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = (message: string, type: ToastType['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load board from PostgreSQL
  const loadBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      setDbError(null);
      const data = await api.fetchBoard('group-our-meals');
      if (data && data.group && Array.isArray(data.members) && Array.isArray(data.dishes)) {
        setAppState(data);
        setIsDbConnected(true);

        // Ensure activeMemberId is valid
        setActiveMemberId((prev) => {
          if (data.members.some((m) => m.id === prev)) return prev;
          return data.members[0]?.id || 'member-maneesh';
        });
      }
    } catch (err: any) {
      console.warn('API error, falling back to local state:', err);
      setDbError(err.message || 'Connecting to database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Add Dish
  const handleAddDish = async (name: string, suggestedBy: string, suggestedByMemberId?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await api.addDish({
        groupId: appState.group.id,
        name,
        suggestedBy,
        suggestedByMemberId,
      });
      setAppState(updated);
      showToast(`Added "${name}" to the board!`);
    } catch (err: any) {
      console.error(err);
      // Fallback local update
      const newDish = {
        id: `dish-${Date.now()}`,
        groupId: appState.group.id,
        name,
        suggestedBy,
        suggestedByMemberId,
        createdAt: new Date().toISOString(),
        likes: suggestedByMemberId ? [suggestedByMemberId] : [],
        dislikes: [],
      };
      setAppState((prev) => ({
        ...prev,
        dishes: [newDish, ...prev.dishes],
      }));
      showToast(`Added "${name}" to the board!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (dishId: string) => {
    const dish = appState.dishes.find((d) => d.id === dishId);
    if (!dish) return;

    if (window.confirm(`Remove "${dish.name}" from the board?`)) {
      try {
        const updated = await api.deleteDish(dishId, appState.group.id);
        setAppState(updated);
        showToast(`Removed "${dish.name}"`, 'info');
      } catch {
        setAppState((prev) => ({
          ...prev,
          dishes: prev.dishes.filter((d) => d.id !== dishId),
        }));
        showToast(`Removed "${dish.name}"`, 'info');
      }
    }
  };

  // Toggle Like (supports optional targetMemberId)
  const handleToggleLike = async (dishId: string, targetMemberId?: string) => {
    const memberId = targetMemberId || activeMemberId;
    try {
      const updated = await api.toggleLike(dishId, memberId, appState.group.id);
      setAppState(updated);
    } catch {
      // Local fallback
      setAppState((prev) => ({
        ...prev,
        dishes: prev.dishes.map((d) => {
          if (d.id !== dishId) return d;
          const isLiked = d.likes.includes(memberId);
          return {
            ...d,
            likes: isLiked
              ? d.likes.filter((id) => id !== memberId)
              : [...d.likes, memberId],
            dislikes: d.dislikes.filter((id) => id !== memberId),
          };
        }),
      }));
    }
  };

  // Toggle Dislike (supports optional targetMemberId)
  const handleToggleDislike = async (dishId: string, targetMemberId?: string) => {
    const memberId = targetMemberId || activeMemberId;
    try {
      const updated = await api.toggleDislike(dishId, memberId, appState.group.id);
      setAppState(updated);
    } catch {
      // Local fallback
      setAppState((prev) => ({
        ...prev,
        dishes: prev.dishes.map((d) => {
          if (d.id !== dishId) return d;
          const isDisliked = d.dislikes.includes(memberId);
          return {
            ...d,
            dislikes: isDisliked
              ? d.dislikes.filter((id) => id !== memberId)
              : [...d.dislikes, memberId],
            likes: d.likes.filter((id) => id !== memberId),
          };
        }),
      }));
    }
  };

  // Add preference (Like / Dislike) for existing or new dish
  const handleAddDishPreference = async (
    dishName: string,
    memberId: string,
    preference: 'like' | 'dislike'
  ) => {
    const trimmed = dishName.trim();
    if (!trimmed) return;

    const member = appState.members.find((m) => m.id === memberId);
    const memberName = member?.name || 'Member';

    // Check if dish already exists in group (case-insensitive)
    const existingDish = appState.dishes.find(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existingDish) {
      if (preference === 'like') {
        if (!existingDish.likes.includes(memberId)) {
          await handleToggleLike(existingDish.id, memberId);
        }
      } else {
        if (!existingDish.dislikes.includes(memberId)) {
          await handleToggleDislike(existingDish.id, memberId);
        }
      }
      showToast(`Updated ${memberName}'s taste for "${existingDish.name}"`);
    } else {
      // Create new dish and assign the preference
      try {
        const updated = await api.addDish({
          groupId: appState.group.id,
          name: trimmed,
          suggestedBy: memberName,
          suggestedByMemberId: memberId,
        });

        const newDish = updated.dishes.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
        if (newDish && preference === 'dislike') {
          const withDislike = await api.toggleDislike(newDish.id, memberId, appState.group.id);
          setAppState(withDislike);
        } else {
          setAppState(updated);
        }
        showToast(
          `Added "${trimmed}" to ${memberName}'s ${preference === 'like' ? 'Likes' : "Don't Likes"}!`
        );
      } catch {
        // Fallback local state
        const newDish = {
          id: `dish-${Date.now()}`,
          groupId: appState.group.id,
          name: trimmed,
          suggestedBy: memberName,
          suggestedByMemberId: memberId,
          createdAt: new Date().toISOString(),
          likes: preference === 'like' ? [memberId] : [],
          dislikes: preference === 'dislike' ? [memberId] : [],
        };
        setAppState((prev) => ({
          ...prev,
          dishes: [newDish, ...prev.dishes],
        }));
        showToast(
          `Added "${trimmed}" to ${memberName}'s ${preference === 'like' ? 'Likes' : "Don't Likes"}!`
        );
      }
    }
  };

  // Add Member
  const handleAddMember = async (name: string, avatarColor?: string) => {
    try {
      const updated = await api.addMember({
        groupId: appState.group.id,
        name,
        avatarColor,
      });
      setAppState(updated);
      showToast(`Welcome ${name} to ${appState.group.name}!`);
    } catch {
      const newMember = {
        id: `member-${Date.now()}`,
        groupId: appState.group.id,
        name,
        avatarColor: avatarColor || 'bg-emerald-700',
        createdAt: new Date().toISOString(),
      };
      setAppState((prev) => ({
        ...prev,
        members: [...prev.members, newMember],
      }));
      showToast(`Added ${name}!`);
    }
  };

  // Delete Member
  const handleDeleteMember = async (memberId: string) => {
    try {
      const updated = await api.deleteMember(memberId, appState.group.id);
      setAppState(updated);
      if (activeMemberId === memberId) {
        setActiveMemberId(updated.members[0]?.id || '');
      }
      showToast('Member removed', 'info');
    } catch {
      setAppState((prev) => {
        const remaining = prev.members.filter((m) => m.id !== memberId);
        if (activeMemberId === memberId) {
          setActiveMemberId(remaining[0]?.id || '');
        }
        return {
          ...prev,
          members: remaining,
        };
      });
      showToast('Member removed', 'info');
    }
  };

  const scrollToMembers = () => {
    membersSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-charcoal flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        group={appState.group}
        members={appState.members}
        activeMemberId={activeMemberId}
        onChangeActiveMember={(id) => setActiveMemberId(id)}
        onOpenMembers={scrollToMembers}
        isDbConnected={isDbConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {/* Database Sync Status Banner */}
        <div className="flex items-center justify-between text-xs bg-surface/70 border border-border px-4 py-2 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-charcoal">PostgreSQL Single Source of Truth:</span>
            <span className="text-emerald-700 font-medium">
              {isDbConnected ? 'Neon PostgreSQL Connected' : 'Connecting to database...'}
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
          {dbError && !isLoading && (
            <div className="flex items-center gap-1 text-amber-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Offline cache active</span>
            </div>
          )}
        </div>

        {/* 1. HERO FEATURE: What should we eat? Dish Idea Input */}
        <HeroDishInput
          members={appState.members}
          activeMemberId={activeMemberId}
          onChangeActiveMember={(id) => setActiveMemberId(id)}
          onAddDish={handleAddDish}
          isSubmitting={isSubmitting}
        />

        {/* 2. DISH IDEAS FEED */}
        <DishFeed
          dishes={appState.dishes}
          members={appState.members}
          activeMemberId={activeMemberId}
          onToggleLike={handleToggleLike}
          onToggleDislike={handleToggleDislike}
          onDeleteDish={handleDeleteDish}
        />

        {/* 3. GROUP INSIGHTS (Most Liked, Popular Ideas, Disliked Dishes) */}
        <GroupInsights
          dishes={appState.dishes}
          members={appState.members}
        />

        {/* 4. MEMBERS SECTION */}
        <div ref={membersSectionRef}>
          <MembersSection
            members={appState.members}
            dishes={appState.dishes}
            activeMemberId={activeMemberId}
            onSelectMember={(id) => setActiveMemberId(id)}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            onToggleLike={handleToggleLike}
            onToggleDislike={handleToggleDislike}
            onAddDishPreference={handleAddDishPreference}
          />
        </div>

        {/* 5. SIMPLE AI HELPER (Need an idea?) */}
        <SimpleAISuggestions
          dishes={appState.dishes}
          members={appState.members}
          activeMemberId={activeMemberId}
          onAddDish={handleAddDish}
          showToast={showToast}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-charcoal-muted">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-charcoal">
            MealTogether &mdash; Simple Collaborative Food Ideas Board
          </p>
          <p>
            Powered by Neon PostgreSQL &bull; Maneesh, Jinka, Vishwa
          </p>
        </div>
      </footer>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
