import type { Group } from '../types';
import { sampleGroup } from '../data/sampleData';

const GROUPS_STORAGE_KEY = 'mealtogether_groups_v1';
const ACTIVE_GROUP_ID_KEY = 'mealtogether_active_group_id_v1';

export function loadStoredGroups(): Group[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) {
      saveGroups([sampleGroup]);
      setActiveGroupId(sampleGroup.id);
      return [sampleGroup];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [sampleGroup];
  } catch (err) {
    console.error('Error reading localStorage groups:', err);
    return [sampleGroup];
  }
}

export function saveGroups(groups: Group[]): void {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error('Error saving groups to localStorage:', err);
  }
}

export function getActiveGroupId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_GROUP_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveGroupId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_GROUP_ID_KEY, id);
  } catch (err) {
    console.error('Error setting active group id:', err);
  }
}

export function resetToSampleData(): Group {
  saveGroups([sampleGroup]);
  setActiveGroupId(sampleGroup.id);
  return sampleGroup;
}
