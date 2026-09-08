import React, { useState, useEffect, useRef } from 'react';
import type { Group, DayKey, MealSlot } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  Key,
  Send,
  X,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  ChefHat,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AIChatWidgetProps {
  activeGroup: Group;
  onUpdateMealPlan?: (dayKey: DayKey, mealType: keyof MealSlot, value: string) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedDish?: string;
}

const STORAGE_KEY_API_KEY = 'mealplan_gemini_custom_api_key';
const STORAGE_KEY_USE_CUSTOM = 'mealplan_gemini_use_custom_key';
const STORAGE_KEY_CHAT_HISTORY = 'mealplan_chat_history_';

const QUICK_PROMPTS = [
  '🍽️ Suggest dinner for tonight that everyone will love',
  '⚡ Give me a 15-min quick lunch recipe',
  '⚠️ Check for taste conflicts among members',
  '🛒 Make a grocery list based on our meal plan',
  '🥗 Suggest high-protein meals for this week',
];

const DAYS_LIST: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  activeGroup,
  onUpdateMealPlan,
  showToast,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isKeySettingsOpen, setIsKeySettingsOpen] = useState<boolean>(false);
  
  // Custom Key State
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  });
  const [useCustomKey, setUseCustomKey] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_USE_CUSTOM) === 'true';
  });
  const [tempKeyInput, setTempKeyInput] = useState<string>(customKey);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [keyValidationMessage, setKeyValidationMessage] = useState<string>('');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_CHAT_HISTORY}${activeGroup.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add to Meal Plan mini-modal state
  const [slotPickerDish, setSlotPickerDish] = useState<string | null>(null);
  const [pickerDay, setPickerDay] = useState<DayKey>('monday');
  const [pickerSlot, setPickerSlot] = useState<keyof MealSlot>('dinner');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save chat to localStorage per group
  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY_CHAT_HISTORY}${activeGroup.id}`,
        JSON.stringify(messages)
      );
    } catch {
      // ignore
    }
  }, [messages, activeGroup.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const activeApiKey = useCustomKey && customKey.trim().length > 0 ? customKey.trim() : undefined;

  // Handle validating custom key
  const handleSaveAndTestKey = async () => {
    const trimmed = tempKeyInput.trim();
    if (!trimmed) {
      setCustomKey('');
      setUseCustomKey(false);
      localStorage.removeItem(STORAGE_KEY_API_KEY);
      localStorage.setItem(STORAGE_KEY_USE_CUSTOM, 'false');
      setKeyValidationStatus('idle');
      setKeyValidationMessage('Using default server Gemini key');
      showToast?.('Switched to default server API key', 'info');
      return;
    }

    setKeyValidationStatus('validating');
    setKeyValidationMessage('Verifying key with Gemini API...');

    try {
      const res = await api.validateAIKey(trimmed);
      if (res.valid) {
        setCustomKey(trimmed);
        setUseCustomKey(true);
        localStorage.setItem(STORAGE_KEY_API_KEY, trimmed);
        localStorage.setItem(STORAGE_KEY_USE_CUSTOM, 'true');
        setKeyValidationStatus('valid');
        setKeyValidationMessage('API key is valid and activated!');
        showToast?.('Gemini API key validated and saved!', 'success');
        setTimeout(() => setIsKeySettingsOpen(false), 1200);
      } else {
        setKeyValidationStatus('invalid');
        setKeyValidationMessage(res.error || res.message || 'Key validation failed. Please check the key.');
        showToast?.('Invalid Gemini API key', 'error');
      }
    } catch (err: any) {
      setKeyValidationStatus('invalid');
      setKeyValidationMessage(err.message || 'Could not validate API key');
      showToast?.('Key validation error', 'error');
    }
  };

  const handleClearKey = () => {
    setCustomKey('');
    setTempKeyInput('');
    setUseCustomKey(false);
    localStorage.removeItem(STORAGE_KEY_API_KEY);
    localStorage.setItem(STORAGE_KEY_USE_CUSTOM, 'false');
    setKeyValidationStatus('idle');
    setKeyValidationMessage('');
    showToast?.('Custom key cleared. Using server key.', 'info');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputQuery).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuery('');
    if (!isOpen) setIsOpen(true);
    setIsLoading(true);

    try {
      const historyForApi = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await api.sendAIChat(
        historyForApi,
        {
          groupName: activeGroup.name,
          members: activeGroup.members.map((m) => ({
            name: m.name,
            likes: m.likes,
            dislikes: m.dislikes,
          })),
          mealPlan: activeGroup.mealPlan,
        },
        activeApiKey
      );

      // Simple heuristic to extract dish suggestion if present
      let detectedDish: string | undefined = undefined;
      const dishMatch = reply.match(/(?:suggest|recommend|dish|try):\s*\*?\*?([A-Za-z0-9\s+&/-]{3,35})\*?\*?/i);
      if (dishMatch && dishMatch[1]) {
        detectedDish = dishMatch[1].trim();
      }

      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedDish: detectedDish,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **AI Chat Error**: ${err.message || 'Could not connect to Gemini AI.'}\n\n*Tip: Check if your Gemini API key is valid by clicking the 🔑 Key button above.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast?.('Copied to clipboard', 'info');
  };

  const handleApplyDishToPlan = () => {
    if (!slotPickerDish || !onUpdateMealPlan) return;
    onUpdateMealPlan(pickerDay, pickerSlot, slotPickerDish);
    showToast?.(`Added "${slotPickerDish}" to ${pickerDay.toUpperCase()} ${pickerSlot}!`, 'success');
    setSlotPickerDish(null);
  };

  const memberNames = activeGroup.members.map((m) => m.name).join(', ') || 'No members';

  // Format AI markdown-like reply safely into simple HTML tags
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-xs sm:text-sm text-charcoal mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-bold text-sm sm:text-base text-primary mt-2 mb-1">{line.replace('## ', '')}</h3>;
      }
      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5 text-xs text-charcoal">
            <span className="text-primary font-bold">•</span>
            <span>{renderInlineBold(itemText)}</span>
          </div>
        );
      }
      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5 text-xs text-charcoal">
            <span className="text-primary font-bold">{numMatch[1]}.</span>
            <span>{renderInlineBold(numMatch[2])}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-charcoal leading-relaxed">
          {renderInlineBold(line)}
        </p>
      );
    });
  };

  const renderInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-charcoal">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-charcoal-muted">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div
          className="w-[92vw] sm:w-[440px] h-[580px] max-h-[82vh] bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ boxShadow: '0 20px 40px -15px rgba(16, 185, 129, 0.2), 0 0 20px 0 rgba(0, 0, 0, 0.15)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white border border-white/20">
                <ChefHat className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-1">
                    AI Meal Assistant
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </h3>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-medium text-emerald-100">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/80 truncate max-w-[210px]">
                  Group: {activeGroup.name} ({activeGroup.members.length} members)
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              {/* API Key Toggle Button */}
              <button
                type="button"
                onClick={() => setIsKeySettingsOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                  isKeySettingsOpen
                    ? 'bg-white text-emerald-900 font-semibold'
                    : useCustomKey && customKey
                    ? 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 border border-amber-300/40'
                    : 'text-white/80 hover:bg-white/15'
                }`}
                title="Configure Gemini API Key"
              >
                <Key className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {useCustomKey && customKey ? 'Custom Key' : 'Key'}
                </span>
              </button>

              {/* Clear Chat */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear AI chat conversation?')) {
                      setMessages([]);
                    }
                  }}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Minimize */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                title="Minimize AI Chat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KEY SETTINGS OVERLAY / PANEL */}
          {isKeySettingsOpen && (
            <div className="bg-emerald-950/95 text-white p-3.5 border-b border-emerald-800 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold flex items-center gap-1.5 text-emerald-200">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Gemini API Key Settings
                </span>
                <button
                  type="button"
                  onClick={() => setIsKeySettingsOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-emerald-100/70 mb-2">
                Use our pre-configured server key or supply your own Google Gemini API Key:
              </p>

              <div className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    type={showKeyPassword ? 'text' : 'password'}
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="Enter custom Gemini API key (AIza...)"
                    className="w-full bg-emerald-900/90 border border-emerald-700/80 rounded-lg px-2.5 py-1.5 pr-8 text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword((prev) => !prev)}
                    className="absolute right-2 text-emerald-300/70 hover:text-emerald-200"
                    title={showKeyPassword ? 'Hide Key' : 'Show Key'}
                  >
                    {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {keyValidationMessage && (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded ${
                      keyValidationStatus === 'valid'
                        ? 'bg-emerald-900 text-emerald-200'
                        : keyValidationStatus === 'invalid'
                        ? 'bg-rose-950 text-rose-200 border border-rose-800'
                        : 'text-amber-200'
                    }`}
                  >
                    {keyValidationStatus === 'valid' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {keyValidationStatus === 'invalid' && <AlertCircle className="w-3 h-3 text-rose-400" />}
                    {keyValidationStatus === 'validating' && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                    <span>{keyValidationMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={keyValidationStatus === 'validating'}
                      onClick={handleSaveAndTestKey}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-charcoal font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {keyValidationStatus === 'validating' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Save & Test</span>
                        </>
                      )}
                    </button>
                    {customKey && (
                      <button
                        type="button"
                        onClick={handleClearKey}
                        className="px-2.5 py-1 text-xs bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 rounded-lg transition-colors"
                      >
                        Reset to Server Key
                      </button>
                    )}
                  </div>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-300 underline hover:text-emerald-100 flex items-center gap-0.5"
                  >
                    Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ADD TO MEAL PLAN MINI MODAL */}
          {slotPickerDish && (
            <div className="bg-surface border-b border-primary/20 p-3 bg-primary-soft/30 animate-in fade-in text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-charcoal flex items-center gap-1">
                  <CalendarPlus className="w-3.5 h-3.5 text-primary" />
                  Add &quot;{slotPickerDish}&quot; to Meal Plan:
                </span>
                <button
                  type="button"
                  onClick={() => setSlotPickerDish(null)}
                  className="text-charcoal-muted hover:text-charcoal"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pickerDay}
                  onChange={(e) => setPickerDay(e.target.value as DayKey)}
                  className="bg-surface border border-border rounded-lg px-2 py-1 text-xs font-medium text-charcoal"
                >
                  {DAYS_LIST.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select
                  value={pickerSlot}
                  onChange={(e) => setPickerSlot(e.target.value as keyof MealSlot)}
                  className="bg-surface border border-border rounded-lg px-2 py-1 text-xs font-medium text-charcoal"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
                <button
                  type="button"
                  onClick={handleApplyDishToPlan}
                  className="px-3 py-1 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
                >
                  Add Now
                </button>
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-background/50">
            {/* Initial Welcome & Context info */}
            {messages.length === 0 && (
              <div className="space-y-3 py-2">
                <div className="p-3.5 rounded-2xl bg-surface border border-border text-xs space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Hello! How can I help with your meals?</span>
                  </div>
                  <p className="text-charcoal-muted text-[11px] leading-relaxed">
                    I am powered by Gemini AI with full context of <strong>{activeGroup.name}</strong>.
                    I know the taste preferences of <strong>{memberNames}</strong> and can recommend delicious recipes, resolve food disagreements, or suggest full weekly schedules!
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-charcoal-muted">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                      {useCustomKey && customKey ? 'Using Custom Gemini API Key' : 'Using Connected Server Key'}
                    </span>
                  </div>
                </div>

                {/* Quick Starter Suggestions */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider px-1">
                    Quick Suggestions:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left text-xs px-3 py-2 rounded-xl bg-surface hover:bg-primary-soft/50 border border-border hover:border-primary/40 text-charcoal transition-all text-[11px] shadow-sm flex items-center justify-between group"
                      >
                        <span>{prompt}</span>
                        <Send className="w-3 h-3 text-charcoal-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm relative group ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-surface border border-border text-charcoal rounded-bl-none'
                  }`}
                >
                  {/* Content */}
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-1.5">{renderFormattedContent(msg.content)}</div>
                  )}

                  {/* Actions for Assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 pt-1.5 border-t border-border-light flex items-center justify-between text-[10px] text-charcoal-muted">
                      <span>{msg.timestamp}</span>
                      <div className="flex items-center gap-2">
                        {msg.suggestedDish && onUpdateMealPlan && (
                          <button
                            type="button"
                            onClick={() => setSlotPickerDish(msg.suggestedDish || '')}
                            className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                            title="Add recommended dish to meal schedule"
                          >
                            <CalendarPlus className="w-3 h-3" />
                            <span>Add to Schedule</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="hover:text-charcoal flex items-center gap-0.5"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <span className="text-[10px] text-charcoal-muted mt-0.5 mr-1">
                    {msg.timestamp}
                  </span>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-xs text-charcoal-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Chef Gemini is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-2.5 bg-surface border-t border-border flex flex-col gap-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask recipe, meal ideas, substitutions..."
                disabled={isLoading}
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="p-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:hover:bg-primary shadow-sm flex items-center justify-center"
                title="Send query"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-charcoal-muted px-1">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${useCustomKey && customKey ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {useCustomKey && customKey ? 'Custom Key active' : 'Server AI Key active'}
              </span>
              <button
                type="button"
                onClick={() => setIsKeySettingsOpen(true)}
                className="hover:underline text-primary font-medium"
              >
                Configure Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT FLOATING BAR / TEXT BOX AT BOTTOM RIGHT */}
      {!isOpen && (
        <div className="flex items-center gap-2 bg-surface border border-border shadow-xl rounded-full p-1.5 pr-2.5 transition-all duration-200 hover:shadow-2xl hover:border-primary/40 group">
          {/* Main AI Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 text-xs font-semibold text-charcoal hover:text-primary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-charcoal hidden sm:inline">
              AI Chat
            </span>
          </button>

          {/* Key Status Pill */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsKeySettingsOpen(true);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              useCustomKey && customKey
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-2.5 h-2.5" />
            <span>{useCustomKey && customKey ? 'Custom Key' : 'Key: Active'}</span>
          </button>

          {/* Quick inline text box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputQuery.trim()) {
                handleSendMessage();
              } else {
                setIsOpen(true);
              }
            }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Ask AI Chef..."
              className="w-28 sm:w-36 text-xs bg-background border border-border rounded-full px-2.5 py-1 text-charcoal focus:outline-none focus:border-primary focus:w-48 transition-all"
            />
            <button
              type="submit"
              className="p-1 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors shadow-sm"
              title="Open AI Chat"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
