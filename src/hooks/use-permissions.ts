import { useCallback } from "react";

export function usePermissions() {
  const getPermissions = () => {
    try {
      if (typeof window === "undefined") return [];
      const permissions = localStorage.getItem("permissions");
      return permissions ? JSON.parse(permissions) : [];
    } catch (error) {
      console.error("Error parsing permissions:", error);
      return [];
    }
  } 

  const hasPermission = 
    (permission: string) => {
      const permissions = getPermissions();
      return permissions.includes(permission);
    };

  const hasAnyPermission = 
    (requiredPermissions: string[]) => {
      const permissions = getPermissions();
      return requiredPermissions.some((p) => permissions.includes(p));
    };
    
  const hasAllPermissions = 
    (requiredPermissions: string[]) => {
      const permissions = getPermissions();
      return requiredPermissions.every((p) => permissions.includes(p));
    };

  return {
    getPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
