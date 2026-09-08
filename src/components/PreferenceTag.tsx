import React from 'react';
import { X, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';

interface PreferenceTagProps {
  label: string;
  type: 'like' | 'dislike' | 'idea';
  onRemove?: () => void;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  count?: number;
}

export const PreferenceTag: React.FC<PreferenceTagProps> = ({
  label,
  type,
  onRemove,
  showIcon = true,
  size = 'md',
  count,
}) => {
  const isLike = type === 'like';
  const isDislike = type === 'dislike';
  const isIdea = type === 'idea';

  let tagStyle = 'bg-like-bg text-like-text border border-like-border hover:bg-emerald-100/70';
  if (isDislike) {
    tagStyle = 'bg-dislike-bg text-dislike-text border border-dislike-border hover:bg-red-100/70';
  } else if (isIdea) {
    tagStyle = 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/80';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-150 ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
      } ${tagStyle}`}
    >
      {showIcon && (
        <span className="shrink-0">
          {isLike && <ThumbsUp className="w-3 h-3 text-emerald-600" />}
          {isDislike && <ThumbsDown className="w-3 h-3 text-red-500" />}
          {isIdea && <Lightbulb className="w-3 h-3 text-amber-600 fill-amber-400" />}
        </span>
      )}
      <span className="truncate max-w-[180px] sm:max-w-[220px]">{label}</span>
      {typeof count === 'number' && (
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
            isLike
              ? 'bg-emerald-200 text-emerald-800'
              : isDislike
              ? 'bg-red-200 text-red-800'
              : 'bg-amber-200 text-amber-900'
          }`}
        >
          {count}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`shrink-0 ml-0.5 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 ${
            isLike
              ? 'hover:bg-emerald-200 text-emerald-700 hover:text-emerald-900 focus:ring-emerald-400'
              : isDislike
              ? 'hover:bg-red-200 text-red-700 hover:text-red-900 focus:ring-red-400'
              : 'hover:bg-amber-200 text-amber-700 hover:text-amber-900 focus:ring-amber-400'
          }`}
          title={`Remove ${label}`}
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
