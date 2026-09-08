import React, { useState } from 'react';
import { X, UtensilsCrossed } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, creatorName: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please enter a group or meal plan name.');
      return;
    }
    if (!creatorName.trim()) {
      setError('Please enter your name.');
      return;
    }

    onCreateGroup(groupName.trim(), creatorName.trim());
    setGroupName('');
    setCreatorName('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-modal overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-charcoal text-lg">Create a Meal Plan</h2>
              <p className="text-xs text-charcoal-muted">Start a shared group for your household or team</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-border-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider">
              Group / Meal Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Our Weekly Meals, Roommate Dinners"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider">
              Your Name (Creator) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Rahul"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
            />
          </div>

          <div className="pt-3 border-t border-border-light flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-charcoal-muted hover:text-charcoal rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
