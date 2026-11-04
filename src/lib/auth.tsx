import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ensureSuperAdmin } from "@/lib/account.functions";
import { getEntitlements, type Entitlements, type PlanId } from "@/lib/membership";

export type Profile = {
  id: string;
  full_name: string;
  university_id: string | null;
  faculty_id: string | null;
  department_id: string | null;
  academic_level_id: string | null;
  semester_id: string | null;
  avatar_url: string | null;
  onboarded: boolean;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  isAdmin: boolean;
  plan: PlanId;
  entitlements: Entitlements;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * The app's single Supabase auth listener. Mounted once in the root route so
 * the header, dashboards and guards all read the same session state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  // Provision the one super administrator from a private server setting. A
  // student can never reach this path for themselves: the handler compares the
  // caller's email against the server-side SUPER_ADMIN_EMAIL value.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    ensureSuperAdmin()
      .then((result) => {
        if (active && result.provisioned) {
          queryClient.invalidateQueries({ queryKey: ["roles"] });
        }
      })
      .catch(() => {
        /* provisioning is best-effort; a non-admin simply stays a student */
      });
    return () => {
      active = false;
    };
  }, [userId, queryClient]);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, university_id, faculty_id, department_id, academic_level_id, semester_id, avatar_url, onboarded",
        )
        .eq("id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile) ?? null;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["roles", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId as string);
      if (error) throw error;
      return (data ?? []).map((row) => row.role as string);
    },
  });

  const subscriptionQuery = useQuery({
    queryKey: ["subscription", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PlanId> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", userId as string)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return "free";
      if (data.status !== "active") return "free";
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return "free";
      return data.plan as PlanId;
    },
  });

  const isAdmin = (rolesQuery.data ?? []).includes("super_admin");
  const plan: PlanId = subscriptionQuery.data ?? "free";

  const refreshProfile = useCallback(async () => {
    await Promise.all([
      profileQuery.refetch(),
      rolesQuery.refetch(),
      subscriptionQuery.refetch(),
    ]);
  }, [profileQuery, rolesQuery, subscriptionQuery]);

  const signOut = useCallback(async () => {
    // Tear the cache down before the session clears, then replace history so
    // the Back button cannot restore a signed-in dashboard.
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("We could not sign you out. Please try again.");
      return;
    }
    setSession(null);
    navigate({ to: "/login", replace: true });
  }, [queryClient, navigate]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      loading,
      profile: profileQuery.data ?? null,
      profileLoading: profileQuery.isLoading,
      isAdmin,
      plan,
      entitlements: getEntitlements(plan),
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      loading,
      profileQuery.data,
      profileQuery.isLoading,
      isAdmin,
      plan,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
