/**
 * useRole — centralised role-check hook.
 * Returns helper booleans derived from the Base44 user object.
 */
import { useMemo } from "react";

export function useRole(user) {
  return useMemo(() => {
    if (!user) return { isAdmin: false, isCoach: false, isTrainee: true };
    const roles = user.roles || [];
    const isAdmin  = user.role === "admin"  || roles.includes("admin");
    const isCoach  = user.role === "coach"  || roles.includes("coach") || isAdmin;
    const isTrainee = !isCoach;
    return { isAdmin, isCoach, isTrainee };
  }, [user]);
}