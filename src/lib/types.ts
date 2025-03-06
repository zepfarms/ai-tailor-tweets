export interface User {
  id: string;
  email: string;
  name: string;
  xLinked: boolean;
  xUsername?: string;
}

export interface XAccount {
  id: string;
  userId: string;
  xUserId: string;
  xUsername: string;
  profileImageUrl?: string;
  accessToken: string;
  accessTokenSecret: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  content: string;
  scheduledFor?: Date;
  published: boolean;
  createdAt: Date;
  userId: string;
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
  | "Art";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLinkingX: boolean;
  isVerifying?: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  linkXAccount: () => Promise<void>;
  verifyOtp?: (email: string, token: string) => Promise<boolean>;
}
