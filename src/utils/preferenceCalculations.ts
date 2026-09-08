import type { Member, PreferenceStat, HarmonyStat } from '../types';

/**
 * Normalizes dish name for matching (lowercase, trimmed, collapsed spaces)
 */
export function normalizeDish(dish: string): string {
  return dish.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Capitalizes dish name nicely for display
 */
export function formatDishTitle(dish: string): string {
  const trimmed = dish.trim();
  if (!trimmed) return '';
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate the frequency of liked dishes across all members
 */
export function calculateMostLiked(members: Member[]): PreferenceStat[] {
  const map = new Map<string, { display: string; members: string[] }>();

  members.forEach(member => {
    const memberLikedSet = new Set<string>();
    member.likes.forEach(like => {
      const norm = normalizeDish(like);
      if (norm && !memberLikedSet.has(norm)) {
        memberLikedSet.add(norm);
        if (!map.has(norm)) {
          map.set(norm, { display: formatDishTitle(like), members: [member.name] });
        } else {
          const entry = map.get(norm)!;
          if (!entry.members.includes(member.name)) {
            entry.members.push(member.name);
          }
        }
      }
    });
  });

  const results: PreferenceStat[] = Array.from(map.entries()).map(([_, val]) => ({
    dish: val.display,
    originalNames: [val.display],
    count: val.members.length,
    members: val.members,
  }));

  return results.sort((a, b) => b.count - a.count || a.dish.localeCompare(b.dish));
}

/**
 * Calculate the frequency of disliked dishes across all members
 */
export function calculateMostDisliked(members: Member[]): PreferenceStat[] {
  const map = new Map<string, { display: string; members: string[] }>();

  members.forEach(member => {
    const memberDislikedSet = new Set<string>();
    member.dislikes.forEach(dislike => {
      const norm = normalizeDish(dislike);
      if (norm && !memberDislikedSet.has(norm)) {
        memberDislikedSet.add(norm);
        if (!map.has(norm)) {
          map.set(norm, { display: formatDishTitle(dislike), members: [member.name] });
        } else {
          const entry = map.get(norm)!;
          if (!entry.members.includes(member.name)) {
            entry.members.push(member.name);
          }
        }
      }
    });
  });

  const results: PreferenceStat[] = Array.from(map.entries()).map(([_, val]) => ({
    dish: val.display,
    originalNames: [val.display],
    count: val.members.length,
    members: val.members,
  }));

  return results.sort((a, b) => b.count - a.count || a.dish.localeCompare(b.dish));
}

/**
 * Comprehensive harmony analysis (all dishes with like & dislike breakdown)
 */
export function calculateDishHarmony(members: Member[]): HarmonyStat[] {
  const dishMap = new Map<string, {
    display: string;
    likedBy: string[];
    dislikedBy: string[];
  }>();

  members.forEach(member => {
    // Likes
    const seenLikes = new Set<string>();
    member.likes.forEach(dish => {
      const norm = normalizeDish(dish);
      if (!norm || seenLikes.has(norm)) return;
      seenLikes.add(norm);

      if (!dishMap.has(norm)) {
        dishMap.set(norm, { display: formatDishTitle(dish), likedBy: [], dislikedBy: [] });
      }
      dishMap.get(norm)!.likedBy.push(member.name);
    });

    // Dislikes
    const seenDislikes = new Set<string>();
    member.dislikes.forEach(dish => {
      const norm = normalizeDish(dish);
      if (!norm || seenDislikes.has(norm)) return;
      seenDislikes.add(norm);

      if (!dishMap.has(norm)) {
        dishMap.set(norm, { display: formatDishTitle(dish), likedBy: [], dislikedBy: [] });
      }
      dishMap.get(norm)!.dislikedBy.push(member.name);
    });
  });

  return Array.from(dishMap.values()).map(item => ({
    dish: item.display,
    likeCount: item.likedBy.length,
    dislikeCount: item.dislikedBy.length,
    likedBy: item.likedBy,
    dislikedBy: item.dislikedBy,
  }));
}
