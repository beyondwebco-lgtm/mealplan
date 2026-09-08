import React, { useState } from 'react';
import type { NavigationTab, Group } from '../types';
import { Utensils, LayoutDashboard, Users, Calendar, Sparkles, Menu, X, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeGroup: Group;
  onOpenJoinGroup: () => void;
  onOpenCreateGroup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeGroup,
  onOpenJoinGroup,
  onOpenCreateGroup,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'mealplan', label: 'Meal Plan', icon: <Calendar className="w-4 h-4" /> },
    { id: 'summary', label: 'Preferences', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2.5 text-primary hover:opacity-90 transition-opacity focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-charcoal flex items-center gap-0.5">
                  Meal<span className="text-primary">Together</span>
                </span>
                <span className="hidden sm:block text-[10px] font-medium text-charcoal-muted uppercase tracking-widest leading-none">
                  Collaborative Meal Planning
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-soft text-primary'
                        : 'text-charcoal-muted hover:text-charcoal hover:bg-background'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Side: Group Context & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Group Switcher Button */}
            <button
              type="button"
              onClick={onOpenJoinGroup}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-border-light text-xs font-medium text-charcoal transition-colors max-w-[140px] sm:max-w-[200px]"
              title="Switch or join group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">{activeGroup.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
            </button>

            {/* User Profile Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shadow-sm select-none"
              title={`Logged in as ${activeGroup.creatorName}`}
            >
              {activeGroup.creatorName ? activeGroup.creatorName.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-charcoal-muted hover:text-charcoal hover:bg-background rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top duration-150">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-charcoal hover:bg-background'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border-light flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateGroup();
              }}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-primary text-white"
            >
              + New Meal Plan
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoinGroup();
              }}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-background border border-border text-charcoal"
            >
              Switch Group
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
