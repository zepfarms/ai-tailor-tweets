export interface User {
  id: string;
  email: string;
  name: string;
  xLinked?: boolean;
  xUsername?: string | null;
  useHashtags?: boolean;
  isDemoAccount?: boolean;
  isXPremium?: boolean;
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
  data: string;
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
  | "Cryptocurrency"
  | "Trending"
  | "Finance"
  | "Education"
  | "Real Estate"
  | "Marketing"
  | "Fitness"
  | "Parenting"
  | "DIY"
  | "Environment"
  | "Startups"
  | string; // Allow custom topics as strings

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLinkingX: boolean;
  isLoginingWithX: boolean;
  isVerifying: boolean;
  hasSubscription: boolean | null;
  updateSubscriptionStatus: () => Promise<boolean>;
  updateUserPreferences?: (preferences: Partial<User>) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  loginWithX: () => Promise<void>;
  completeXAuth: (magicLink: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  linkXAccount: (redirectUri?: string) => Promise<void>;
  postToX: (data: PostToXData) => Promise<any>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
}

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

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripe_customer_id: string;
  stripe_subscription_id: string;
  created_at: string;
  updated_at: string;
  canceled_at?: string;
}

export interface XPost {
  id: string;
  content: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  impressions_count: number;
  engagement_rate: number;
  has_media: boolean;
  created_at: string;
  media_urls?: string[] | null;
}
