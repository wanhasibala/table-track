import { NextResponse } from "next/server";
import { calculateDeliveryFee } from "@/utils/delivery";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Force cache invalidation: v1.0.2
// Misenary Shop Origin coordinates (e.g. Central Jakarta)
const SHOP_ORIGIN = {
  lat: -6.2088,
  lng: 106.8456,
  address: "Misenary Fruits Shop, Jl. Sudirman, Jakarta, Indonesia"
};

// Helper to calculate straight line distance in meters (with factor for driving distance)
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, latitude, longitude, tenantId } = body;

    const hasCoords = typeof latitude === "number" && typeof longitude === "number";

    if (!address && !hasCoords) {
      return NextResponse.json({
        success: false,
        message: "Delivery address or coordinates are required"
      }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // Resolve Origin details from DB if tenantId is provided
    let originAddress = SHOP_ORIGIN.address;
    let originLat = SHOP_ORIGIN.lat;
    let originLng = SHOP_ORIGIN.lng;

    if (tenantId) {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { data: tenantData } = await supabase
          .from("tenant")
          .select("address, latitude, longitude" as any)
          .eq("id", tenantId)
          .single();

        if (tenantData) {
          const tData = tenantData as any;
          if (tData.address) {
            originAddress = tData.address;
          }
          
          if (typeof tData.latitude === "number" && typeof tData.longitude === "number") {
            originLat = tData.latitude;
            originLng = tData.longitude;
            console.log(`Using database tenant coordinates directly: ${originLat}, ${originLng}`);
          } else if (originAddress) {
            if (apiKey) {
              // Geocode origin address to coordinates
              const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(originAddress)}&key=${apiKey}`;
              const geoRes = await fetch(geocodeUrl);
              const geoData = await geoRes.json();
              if (geoData.status === "OK" && geoData.results?.length) {
                const location = geoData.results[0].geometry.location;
                originLat = location.lat;
                originLng = location.lng;
                console.log(`Geocoded database origin address to: ${originLat}, ${originLng}`);
              }
            } else {
              // For mock fallback, shift mock origin based on address string length
              const len = originAddress.length;
              originLat = SHOP_ORIGIN.lat + ((len % 5) * 0.005);
              originLng = SHOP_ORIGIN.lng + ((len % 7) * 0.005);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenant address from database:", err);
      }
    }

    if (apiKey) {
      console.log(`Using Google Maps API to calculate distance from origin: ${originAddress}`);
      let finalLat = latitude;
      let finalLng = longitude;
      let finalAddress = address || "";

      // 1. Resolve destination address to coordinates using Geocoding API (if address provided without coords)
      if (!hasCoords && address) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const geoRes = await fetch(geocodeUrl);
        const geoData = await geoRes.json();

        if (geoData.status !== "OK" || !geoData.results?.length) {
          return NextResponse.json({
            success: false,
            message: "Could not find coordinates for this address. Please try another address."
          }, { status: 400 });
        }

        const location = geoData.results[0].geometry.location;
        finalLat = location.lat;
        finalLng = location.lng;
        finalAddress = geoData.results[0].formatted_address;
      } 
      // 2. Resolve coords to address using Reverse Geocoding (if coords provided without address)
      else if (hasCoords && !address) {
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
        const geoRes = await fetch(reverseGeocodeUrl);
        const geoData = await geoRes.json();

        if (geoData.status === "OK" && geoData.results?.length) {
          finalAddress = geoData.results[0].formatted_address;
        } else {
          finalAddress = `Pinpoint Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }
      }

      // 3. Fetch driving distance using Distance Matrix API
      const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${finalLat},${finalLng}&key=${apiKey}`;
      const distRes = await fetch(distanceUrl);
      const distData = await distRes.json();

      if (
        distData.status !== "OK" ||
        !distData.rows?.length ||
        !distData.rows[0].elements?.length ||
        distData.rows[0].elements[0].status !== "OK"
      ) {
        return NextResponse.json({
          success: false,
          message: "Could not calculate driving distance to this address. Please try another location."
        }, { status: 400 });
      }

      const element = distData.rows[0].elements[0];
      const distanceMeters = element.distance.value;
      const durationText = element.duration.text;
      
      try {
        const fee = calculateDeliveryFee(distanceMeters);
        return NextResponse.json({
          success: true,
          distanceMeters,
          distanceKm: parseFloat((distanceMeters / 1000).toFixed(1)),
          durationText,
          deliveryFee: fee,
          latitude: finalLat,
          longitude: finalLng,
          address: finalAddress
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: err.message || "Out of delivery range"
        }, { status: 400 });
      }

    } else {
      // --- MOCK FALLBACK FOR PORTFOLIO DEMO ---
      let finalLat = latitude;
      let finalLng = longitude;
      let finalAddress = address || "";
      let distanceMeters = 0;

      if (hasCoords) {
        // Calculate direct line distance + add 30% for simulated driving route
        distanceMeters = Math.round(getHaversineDistance(originLat, originLng, latitude, longitude) * 1.3);
        if (!finalAddress) {
          finalAddress = `Near Tenant Origin Pinpoint (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }
      } else {
        const cleaned = address.trim();
        const length = cleaned.length;
        // Distance will range from 1.5 km to 15.5 km
        distanceMeters = Math.min(15000, ((length % 10) * 1300) + 2000);
        
        finalLat = originLat + (Math.sin(length) * 0.04);
        finalLng = originLng + (Math.cos(length) * 0.04);
      }

      const distanceKm = distanceMeters / 1000;
      const durationMins = Math.ceil(distanceKm * 2.5) + 5;
      
      console.log(`Mock mode: calculated simulated distance ${distanceKm} km for address: ${finalAddress}`);

      // Throw out of bounds error if simulated distance exceeds 15km
      if (distanceKm > 15) {
        return NextResponse.json({
          success: false,
          message: "Oh no! Your location is outside our 15km fresh-cut fruit delivery radius. Please try a closer address or switch to Store Pick-Up."
        }, { status: 400 });
      }

      try {
        const fee = calculateDeliveryFee(distanceMeters);
        return NextResponse.json({
          success: true,
          distanceMeters,
          distanceKm: parseFloat(distanceKm.toFixed(1)),
          durationText: `${durationMins} mins`,
          deliveryFee: fee,
          latitude: finalLat,
          longitude: finalLng,
          address: finalAddress
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: err.message || "Out of delivery range"
        }, { status: 400 });
      }
    }

  } catch (err: any) {
    console.error("Delivery calculation error:", err);
    return NextResponse.json({
      success: false,
      message: "An error occurred while calculating delivery distance."
    }, { status: 500 });
  }
}
