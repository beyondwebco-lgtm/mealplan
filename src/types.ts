export interface Group {
  id: string;
  name: string;
  createdAt: string;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  avatarColor?: string;
  createdAt: string;
}

export interface Dish {
  id: string;
  groupId: string;
  name: string;
  suggestedBy: string;
  suggestedByMemberId?: string;
  createdAt: string;
  likes: string[]; // Array of member IDs who liked
  dislikes: string[]; // Array of member IDs who disliked
}

export interface AppState {
  group: Group;
  members: Member[];
  dishes: Dish[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
