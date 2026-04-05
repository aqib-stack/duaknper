"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export type UserRole = "seller" | "customer" | "super_admin";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  signup: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data() as { role?: UserRole } | undefined;
        setUserRole(data?.role || "seller");
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    userRole,
    async signup(name: string, email: string, password: string, role: UserRole = "seller") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      const userRef = doc(db, "users", cred.user.uid);
      const existingUser = await getDoc(userRef);

      if (!existingUser.exists()) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);
        await setDoc(userRef, {
          uid: cred.user.uid,
          name,
          email,
          role,
          subscriptionPlan: role === "seller" ? "Starter Plan" : "none",
          subscriptionStatus: role === "seller" ? "trial" : "na",
          monthlyPriceUsd: role === "seller" ? 10 : 0,
          monthlyPricePkr: role === "seller" ? 2700 : 0,
          trialEndsAt: role === "seller" ? trialEnd.toISOString() : "",
          hasStore: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setUserRole(role);
    },
    async login(email: string, password: string) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", cred.user.uid);
      const snap = await getDoc(userRef);
      const data = snap.data() as { role?: UserRole } | undefined;
      const resolvedRole = data?.role || "seller";
      setUserRole(resolvedRole);
      return resolvedRole;
    },
    async logout() {
      await signOut(auth);
    },
  }), [user, loading, userRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
