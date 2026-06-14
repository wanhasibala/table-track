interface DeliveryConfig {
  baseFare: number;       // Base price for short distances (Rp)
  baseDistanceKm: number; // How many kilometers are covered by the base fare
  perKmRate: number;      // Price per kilometer after the base distance (Rp)
  maxDistanceKm: number;  // Maximum radius willing to deliver fresh fruit (km)
}

export const MISENARY_DELIVERY_CONFIG: DeliveryConfig = {
  baseFare: 10000,        // Rp 10,000 base price
  baseDistanceKm: 3,      // Covers up to 3 km
  perKmRate: 2500,        // +Rp 2,500 every km after
  maxDistanceKm: 15,      // Don't deliver past 15 km
};

export const calculateDeliveryFee = (distanceInMeters: number): number => {
  const distanceKm = distanceInMeters / 1000;

  // 1. Check if the distance exceeds your maximum delivery radius
  if (distanceKm > MISENARY_DELIVERY_CONFIG.maxDistanceKm) {
    throw new Error("Address is outside our fresh delivery zone.");
  }

  // 2. If it's within the base range (e.g., 0 - 3km), return the flat base fare
  if (distanceKm <= MISENARY_DELIVERY_CONFIG.baseDistanceKm) {
    return MISENARY_DELIVERY_CONFIG.baseFare;
  }

  // 3. Calculate additional distance beyond the base cap
  const extraDistance = distanceKm - MISENARY_DELIVERY_CONFIG.baseDistanceKm;
  const extraFare = Math.ceil(extraDistance) * MISENARY_DELIVERY_CONFIG.perKmRate;

  return MISENARY_DELIVERY_CONFIG.baseFare + extraFare;
};
