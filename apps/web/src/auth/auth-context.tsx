import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
