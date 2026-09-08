import React, { useState } from 'react';
import type { Group } from '../types';
import { X, Users, ArrowRight, CheckCircle } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGroups: Group[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onJoinByCode: (codeOrName: string) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  existingGroups,
  activeGroupId,
  onSelectGroup,
  onJoinByCode,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a group name or code.');
      return;
    }
    onJoinByCode(code.trim());
    setCode('');
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
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-charcoal text-lg">Join or Switch Group</h2>
              <p className="text-xs text-charcoal-muted">Select an existing meal plan or join via code</p>
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

        <div className="p-5 space-y-4">
          {/* List of existing available groups */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider">
              Your Saved Meal Groups
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {existingGroups.map((grp) => {
                const isActive = grp.id === activeGroupId;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      onSelectGroup(grp.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-primary-soft/50 border-primary/40 font-semibold'
                        : 'bg-background hover:bg-border-light border-border'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-charcoal">{grp.name}</div>
                      <div className="text-xs text-charcoal-muted">
                        Created by {grp.creatorName} · {grp.members.length} members
                      </div>
                    </div>
                    {isActive ? (
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-charcoal-muted shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Join by Code Input */}
          <form onSubmit={handleJoin} className="space-y-2 pt-3 border-t border-border-light">
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider">
              Or Enter Group Name / Code
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. Our Weekly Meals"
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
