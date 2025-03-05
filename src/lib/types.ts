
export interface User {
  id: string;
  email: string;
  name: string;
  xLinked: boolean;
  xUsername?: string;
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  linkXAccount: () => Promise<void>;
}
