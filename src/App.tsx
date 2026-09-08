import { useState, useEffect, useCallback } from 'react';
import type {
  Group,
  Member,
  NavigationTab,
  DayKey,
  MealSlot,
  Toast,
} from './types';
import { sampleGroup } from './data/sampleData';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { DashboardHeader } from './components/DashboardHeader';
import { MemberList } from './components/MemberList';
import { PreferenceSummary } from './components/PreferenceSummary';
import { WeeklyMealPlan } from './components/WeeklyMealPlan';
import { AddMemberModal } from './components/AddMemberModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { AIChatWidget } from './components/AIChatWidget';
import { ToastContainer } from './components/Toast';
import { Loader2, Database } from 'lucide-react';

export function App() {
  const [groups, setGroups] = useState<Group[]>([sampleGroup]);
  const [activeGroupIdState, setActiveGroupIdState] = useState<string>(sampleGroup.id);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<NavigationTab | 'landing'>('dashboard');

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load from PostgreSQL API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetched = await api.fetchGroups();
      if (Array.isArray(fetched) && fetched.length > 0) {
        setGroups(fetched);
        setIsDbConnected(true);
        setActiveGroupIdState((prev) => {
          if (fetched.some((g) => g.id === prev)) return prev;
          return fetched[0].id;
        });
      }
    } catch (err) {
      console.warn('API error, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeGroup =
    groups.find((g) => g.id === activeGroupIdState) || groups[0] || sampleGroup;

  // Member CRUD with PostgreSQL
  const handleSaveMember = async (memberData: { name: string; likes: string[]; dislikes: string[] }) => {
    try {
      if (editingMember) {
        // Edit existing member
        const updatedGroup = await api.updateMember(activeGroup.id, editingMember.id, {
          name: memberData.name,
          likes: memberData.likes,
          dislikes: memberData.dislikes,
        });
        setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
        showToast(`Updated preferences for ${memberData.name}`);
      } else {
        // Add new member
        const updatedGroup = await api.addMember(activeGroup.id, {
          name: memberData.name,
          likes: memberData.likes,
          dislikes: memberData.dislikes,
        });
        setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
        showToast(`Added ${memberData.name} to the group`);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback local update
      if (editingMember) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id
              ? {
                  ...g,
                  members: g.members.map((m) =>
                    m.id === editingMember.id ? { ...m, ...memberData } : m
                  ),
                }
              : g
          )
        );
      } else {
        const newMember: Member = {
          id: `member-${Date.now()}`,
          name: memberData.name,
          likes: memberData.likes,
          dislikes: memberData.dislikes,
        };
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id ? { ...g, members: [...g.members, newMember] } : g
          )
        );
      }
      showToast(`Saved member (${memberData.name})`);
    }
    setEditingMember(null);
  };

  const handleDeleteMember = async (memberId: string) => {
    const target = activeGroup.members.find((m) => m.id === memberId);
    if (!target) return;
    if (window.confirm(`Are you sure you want to remove ${target.name} from this meal plan?`)) {
      try {
        const updatedGroup = await api.deleteMember(activeGroup.id, memberId);
        setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
        showToast(`Removed ${target.name} from group`, 'info');
      } catch {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id
              ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
              : g
          )
        );
        showToast(`Removed ${target.name}`, 'info');
      }
    }
  };

  const handleEditMemberClick = (member: Member) => {
    setEditingMember(member);
    setIsAddMemberOpen(true);
  };

  const handleAddMemberClick = () => {
    setEditingMember(null);
    setIsAddMemberOpen(true);
  };

  // Direct like/dislike modifications
  const handleAddLike = async (memberId: string, dish: string) => {
    const targetMember = activeGroup.members.find((m) => m.id === memberId);
    if (!targetMember) return;
    const newLikes = [...targetMember.likes, dish];

    try {
      const updatedGroup = await api.updateMember(activeGroup.id, memberId, { likes: newLikes });
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
      showToast(`Added ${dish} to likes`);
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === memberId ? { ...m, likes: newLikes } : m
                ),
              }
            : g
        )
      );
    }
  };

  const handleRemoveLike = async (memberId: string, dishIndex: number) => {
    const targetMember = activeGroup.members.find((m) => m.id === memberId);
    if (!targetMember) return;
    const newLikes = targetMember.likes.filter((_, idx) => idx !== dishIndex);

    try {
      const updatedGroup = await api.updateMember(activeGroup.id, memberId, { likes: newLikes });
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === memberId ? { ...m, likes: newLikes } : m
                ),
              }
            : g
        )
      );
    }
  };

  const handleAddDislike = async (memberId: string, dish: string) => {
    const targetMember = activeGroup.members.find((m) => m.id === memberId);
    if (!targetMember) return;
    const newDislikes = [...targetMember.dislikes, dish];

    try {
      const updatedGroup = await api.updateMember(activeGroup.id, memberId, { dislikes: newDislikes });
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
      showToast(`Added ${dish} to dislikes`, 'info');
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === memberId ? { ...m, dislikes: newDislikes } : m
                ),
              }
            : g
        )
      );
    }
  };

  const handleRemoveDislike = async (memberId: string, dishIndex: number) => {
    const targetMember = activeGroup.members.find((m) => m.id === memberId);
    if (!targetMember) return;
    const newDislikes = targetMember.dislikes.filter((_, idx) => idx !== dishIndex);

    try {
      const updatedGroup = await api.updateMember(activeGroup.id, memberId, { dislikes: newDislikes });
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === memberId ? { ...m, dislikes: newDislikes } : m
                ),
              }
            : g
        )
      );
    }
  };

  // Meal Plan modifications
  const handleChangeMeal = async (dayKey: DayKey, mealType: keyof MealSlot, value: string) => {
    const updatedPlan = {
      ...activeGroup.mealPlan,
      [dayKey]: {
        ...activeGroup.mealPlan[dayKey],
        [mealType]: value,
      },
    };

    try {
      const updatedGroup = await api.updateMealPlan(activeGroup.id, updatedPlan);
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id ? { ...g, mealPlan: updatedPlan } : g
        )
      );
    }
  };

  const handleClearMealPlan = async () => {
    if (window.confirm('Clear all scheduled meals from this weekly plan?')) {
      const emptyPlan = {
        monday: { breakfast: '', lunch: '', dinner: '' },
        tuesday: { breakfast: '', lunch: '', dinner: '' },
        wednesday: { breakfast: '', lunch: '', dinner: '' },
        thursday: { breakfast: '', lunch: '', dinner: '' },
        friday: { breakfast: '', lunch: '', dinner: '' },
        saturday: { breakfast: '', lunch: '', dinner: '' },
        sunday: { breakfast: '', lunch: '', dinner: '' },
      };

      try {
        const updatedGroup = await api.updateMealPlan(activeGroup.id, emptyPlan);
        setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
        showToast('Weekly meal plan cleared', 'info');
      } catch {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id ? { ...g, mealPlan: emptyPlan } : g
          )
        );
      }
    }
  };

  const [isGeneratingAIPlan, setIsGeneratingAIPlan] = useState<boolean>(false);

  const handleGenerateAIPlan = async () => {
    try {
      setIsGeneratingAIPlan(true);
      const customKey = localStorage.getItem('mealplan_gemini_custom_api_key') || undefined;
      const useCustom = localStorage.getItem('mealplan_gemini_use_custom_key') === 'true';
      const keyToUse = useCustom && customKey ? customKey : undefined;

      showToast('AI Chef is generating a weekly meal plan tailored to your group...', 'info');
      const newPlan = await api.generateAIMealPlan(activeGroup.members, keyToUse);
      const updatedGroup = await api.updateMealPlan(activeGroup.id, newPlan);
      setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
      showToast('AI generated full 7-day meal plan based on member tastes!', 'success');
    } catch (err: any) {
      console.error('AI Meal Plan error:', err);
      showToast(`AI generation error: ${err.message || 'Failed to generate'}`, 'error');
    } finally {
      setIsGeneratingAIPlan(false);
    }
  };

  // Group Management
  const handleCreateGroup = async (groupName: string, creatorName: string) => {
    try {
      const newGroup = await api.createGroup({
        name: groupName,
        creatorName,
        members: [{ id: `member-${Date.now()}`, name: creatorName, likes: [], dislikes: [] }],
      });
      setGroups((prev) => [...prev, newGroup]);
      setActiveGroupIdState(newGroup.id);
      setCurrentTab('dashboard');
      showToast(`Created meal group "${groupName}"`);
    } catch (err: any) {
      showToast(`Error creating group: ${err.message}`, 'error');
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupIdState(groupId);
    setCurrentTab('dashboard');
    showToast('Switched active group');
  };

  const handleJoinByCode = async (codeOrName: string) => {
    const match = groups.find(
      (g) =>
        g.name.toLowerCase() === codeOrName.toLowerCase() ||
        g.id.toLowerCase() === codeOrName.toLowerCase()
    );
    if (match) {
      setActiveGroupIdState(match.id);
      setCurrentTab('dashboard');
      showToast(`Joined group: ${match.name}`);
    } else {
      await handleCreateGroup(codeOrName, 'You');
    }
  };

  return (
    <div className="min-h-screen bg-background text-charcoal flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab === 'landing' ? 'dashboard' : currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        activeGroup={activeGroup}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* PostgreSQL Database Connected indicator */}
        <div className="mb-4 flex items-center justify-between text-xs text-charcoal-muted bg-surface/60 border border-border px-3.5 py-1.5 rounded-xl">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-charcoal">Database:</span>
            <span className="text-emerald-700 font-medium">
              {isDbConnected ? 'Neon PostgreSQL Connected (ep-autumn-poetry)' : 'Connecting to PostgreSQL...'}
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
        </div>

        {currentTab === 'landing' ? (
          <HeroLanding
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
            onExploreDashboard={() => setCurrentTab('dashboard')}
          />
        ) : (
          <div className="space-y-8">
            {/* Dashboard Greeting & Quick Stats */}
            <DashboardHeader
              group={activeGroup}
              onOpenAddMember={handleAddMemberClick}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            />

            {/* Dashboard All-in-One View */}
            {currentTab === 'dashboard' && (
              <>
                {/* Collective Preference Summary */}
                <PreferenceSummary members={activeGroup.members} />

                {/* Member Preference Cards Grid */}
                <MemberList
                  members={activeGroup.members}
                  onOpenAddMember={handleAddMemberClick}
                  onEditMember={handleEditMemberClick}
                  onDeleteMember={handleDeleteMember}
                  onAddLike={handleAddLike}
                  onRemoveLike={handleRemoveLike}
                  onAddDislike={handleAddDislike}
                  onRemoveDislike={handleRemoveDislike}
                />

                {/* Weekly Meal Plan */}
                <WeeklyMealPlan
                  mealPlan={activeGroup.mealPlan}
                  members={activeGroup.members}
                  onChangeMeal={handleChangeMeal}
                  onClearPlan={handleClearMealPlan}
                  onGenerateAIPlan={handleGenerateAIPlan}
                  isGeneratingAIPlan={isGeneratingAIPlan}
                />
              </>
            )}

            {/* Tab: Members View Only */}
            {currentTab === 'members' && (
              <MemberList
                members={activeGroup.members}
                onOpenAddMember={handleAddMemberClick}
                onEditMember={handleEditMemberClick}
                onDeleteMember={handleDeleteMember}
                onAddLike={handleAddLike}
                onRemoveLike={handleRemoveLike}
                onAddDislike={handleAddDislike}
                onRemoveDislike={handleRemoveDislike}
              />
            )}

            {/* Tab: Meal Plan View Only */}
            {currentTab === 'mealplan' && (
              <WeeklyMealPlan
                mealPlan={activeGroup.mealPlan}
                members={activeGroup.members}
                onChangeMeal={handleChangeMeal}
                onClearPlan={handleClearMealPlan}
                onGenerateAIPlan={handleGenerateAIPlan}
                isGeneratingAIPlan={isGeneratingAIPlan}
              />
            )}

            {/* Tab: Preferences / Summary View Only */}
            {currentTab === 'summary' && (
              <PreferenceSummary members={activeGroup.members} />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        editingMember={editingMember}
        onClose={() => {
          setIsAddMemberOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        existingGroups={groups}
        activeGroupId={activeGroup.id}
        onClose={() => setIsJoinGroupOpen(false)}
        onSelectGroup={handleSelectGroup}
        onJoinByCode={handleJoinByCode}
      />

      {/* Floating AI Chat Widget at bottom right */}
      <AIChatWidget
        activeGroup={activeGroup}
        onUpdateMealPlan={handleChangeMeal}
        showToast={showToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
