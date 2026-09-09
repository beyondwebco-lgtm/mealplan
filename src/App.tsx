import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState, Toast as ToastType } from './types';
import { sampleGroup, sampleMembers, sampleDishes } from './data/sampleData';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { MemberSelectScreen } from './components/MemberSelectScreen';
import { HeroDishInput } from './components/HeroDishInput';
import { DishFeed } from './components/DishFeed';
import { GroupInsights } from './components/GroupInsights';
import { MembersSection } from './components/MembersSection';
import { ToastContainer } from './components/Toast';

const FALLBACK_STATE: AppState = {
  group: sampleGroup,
  members: sampleMembers,
  dishes: sampleDishes,
};

const STORAGE_KEY = 'mealtogether_current_member_id';

export function App() {
  const [appState, setAppState] = useState<AppState>(FALLBACK_STATE);
  
  // Read stored member or null if first time
  const [activeMemberId, setActiveMemberId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const [isSelectingMember, setIsSelectingMember] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEY);
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Reference for scrolling to members section
  const membersSectionRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = (message: string, type: ToastType['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Select Member handler
  const handleSelectCurrentMember = (memberId: string) => {
    setActiveMemberId(memberId);
    localStorage.setItem(STORAGE_KEY, memberId);
    setIsSelectingMember(false);
  };

  // Trigger switch member screen
  const handleStartSwitchMember = () => {
    setIsSelectingMember(true);
  };

  // Load board from PostgreSQL / local state
  const loadBoard = useCallback(async () => {
    try {
      const data = await api.fetchBoard('group-our-meals');
      if (data && data.group && Array.isArray(data.members) && Array.isArray(data.dishes)) {
        setAppState(data);
        setIsDbConnected(true);

        // Ensure activeMemberId is valid if already set
        setActiveMemberId((prev) => {
          if (!prev) return null;
          if (data.members.some((m) => m.id === prev)) return prev;
          return data.members[0]?.id || null;
        });
      }
    } catch (err: any) {
      console.warn('API fetch notice, using fallback state:', err);
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
      showToast(`Added "${name}"`);
    } catch {
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
      showToast(`Added "${name}"`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (dishId: string) => {
    const dish = appState.dishes.find((d) => d.id === dishId);
    if (!dish) return;

    if (window.confirm(`Remove "${dish.name}"?`)) {
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

  // Toggle Like
  const handleToggleLike = async (dishId: string, targetMemberId?: string) => {
    const memberId = targetMemberId || activeMemberId || appState.members[0]?.id || 'member-jinka';
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

  // Toggle Dislike
  const handleToggleDislike = async (dishId: string, targetMemberId?: string) => {
    const memberId = targetMemberId || activeMemberId || appState.members[0]?.id || 'member-jinka';
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

  // Add preference (Like / Dislike)
  const handleAddDishPreference = async (
    dishName: string,
    memberId: string,
    preference: 'like' | 'dislike'
  ) => {
    const trimmed = dishName.trim();
    if (!trimmed) return;

    const member = appState.members.find((m) => m.id === memberId);
    const memberName = member?.name || 'Member';

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
      showToast(`Updated tastes for "${existingDish.name}"`);
    } else {
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
          `Added "${trimmed}" to ${memberName}'s ${preference === 'like' ? 'Likes' : "Don't Likes"}`
        );
      } catch {
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
          `Added "${trimmed}" to ${memberName}'s ${preference === 'like' ? 'Likes' : "Don't Likes"}`
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
      showToast(`Added ${name}`);
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
      showToast(`Added ${name}`);
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

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const effectiveMemberId = activeMemberId || appState.members[0]?.id || 'member-jinka';

  // If user hasn't chosen their name or wants to switch member, show Who are you? screen
  if (isSelectingMember || !activeMemberId) {
    return (
      <MemberSelectScreen
        members={appState.members}
        onSelectMember={handleSelectCurrentMember}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-charcoal flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        group={appState.group}
        members={appState.members}
        activeMemberId={effectiveMemberId}
        onChangeActiveMember={(id) => handleSelectCurrentMember(id)}
        onOpenMembers={scrollToMembers}
        onScrollToSection={scrollToSection}
        onSwitchMember={handleStartSwitchMember}
        isDbConnected={isDbConnected}
      />

      {/* Main Single-Column Mobile-First Container */}
      <main className="flex-1 max-w-xl sm:max-w-2xl w-full mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24 sm:pb-12">
        {/* 1. Greeting & What should we eat? Hero Input */}
        <HeroDishInput
          members={appState.members}
          activeMemberId={effectiveMemberId}
          onChangeActiveMember={(id) => handleSelectCurrentMember(id)}
          onAddDish={handleAddDish}
          isSubmitting={isSubmitting}
        />

        {/* 2. Dish Ideas List */}
        <DishFeed
          dishes={appState.dishes}
          activeMemberId={effectiveMemberId}
          onToggleLike={(dishId, targetId) => handleToggleLike(dishId, targetId || effectiveMemberId)}
          onToggleDislike={(dishId, targetId) => handleToggleDislike(dishId, targetId || effectiveMemberId)}
          onDeleteDish={handleDeleteDish}
        />

        {/* 3. Group Insights: What Everyone Likes & Not Everyone Likes */}
        <GroupInsights
          dishes={appState.dishes}
          members={appState.members}
        />

        {/* 4. Members Section */}
        <div ref={membersSectionRef}>
          <MembersSection
            members={appState.members}
            dishes={appState.dishes}
            activeMemberId={effectiveMemberId}
            onSelectMember={(id) => handleSelectCurrentMember(id)}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            onToggleLike={(dishId, targetId) => handleToggleLike(dishId, targetId || effectiveMemberId)}
            onToggleDislike={(dishId, targetId) => handleToggleDislike(dishId, targetId || effectiveMemberId)}
            onAddDishPreference={handleAddDishPreference}
          />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-charcoal-muted">
        <div className="max-w-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="font-medium text-charcoal">
            MealTogether
          </p>
          <p className="text-[11px]">
            Jinka · Arun · Maneesh · Vishwa · Sai Pavan · Tata · Indra
          </p>
        </div>
      </footer>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;

