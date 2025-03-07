
export interface User {
  id: string;
  email: string;
  name: string;
  xLinked?: boolean;
  xUsername?: string;
  isDemoAccount?: boolean;
}

export interface Post {
  id: string;
  content: string;
  scheduledFor?: Date;
  published: boolean;
  createdAt: Date;
  userId: string;
}

export interface MediaItem {
  data: ArrayBuffer;
  type: string;
  size: number;
}

export interface PostToXData {
  content: string;
  media?: MediaItem[];
}

export type Topic = 
  | "Technology"
  | "Politics"
  | "Sports"
  | "Entertainment"
  | "Science"
  | "Business"
  | "Health"
  | "Fashion"
  | "Food"
  | "Travel"
  | "Gaming"
  | "Music"
  | "Art"
  | string; // Allow custom topics as strings

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isVerifying: boolean;
  isLinkingX?: boolean;
  isLoginingWithX?: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithX?: () => Promise<void>;
  completeXAuth?: (magicLink: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  linkXAccount?: (redirectUri?: string) => Promise<void>;
  postToX?: (data: PostToXData) => Promise<any>;
}

// Demo data types
export interface DemoData {
  posts: {
    scheduledPosts: DemoPost[];
    publishedPosts: DemoPost[];
  }
}

export interface DemoPost {
  id: string;
  content: string;
  scheduled_for?: string;
  published: boolean;
  created_at: string;
  user_id: string;
}
