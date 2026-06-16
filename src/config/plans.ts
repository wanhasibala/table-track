export interface PlanConfig {
  maxMenuItems: number;
  maxTableSpots: number;
  enablePushNotifications: boolean;
  enableCustomSubdomain: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    maxMenuItems: 5,        // Free tier can only host 5 menu items
    maxTableSpots: 3,       // Free tier can only host 3 table spots
    enablePushNotifications: false,
    enableCustomSubdomain: false,
  },
  pro: {
    maxMenuItems: Infinity,
    maxTableSpots: Infinity,
    enablePushNotifications: true,
    enableCustomSubdomain: true,
  }
};
