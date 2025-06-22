// Google Maps API service functions
export class GoogleMapsService {
  //   private static apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  //   static setApiKey(key: string) {
  //     this.apiKey = key;
  //   }

  static async geocodeAddress(address: string) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.results[0].formatted_address,
        };
      } else {
        throw new Error(data.error_message || "Address not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  }

  static async reverseGeocode(latitude: number, longitude: number) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        throw new Error(data.error_message || "Location not found");
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  }

  static async getDirections(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: "driving" | "walking" | "transit" | "bicycling" = "driving",
    alternatives = false,
    avoidTolls = false,
    avoidHighways = false
  ) {
    try {
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;

      if (alternatives) url += "&alternatives=true";
      if (avoidTolls) url += "&avoid=tolls";
      if (avoidHighways) url += "&avoid=highways";

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.routes.length > 0) {
        return data.routes.map((route: any) => ({
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          steps: route.legs[0].steps,
          polyline: route.overview_polyline.points,
          bounds: route.bounds,
          summary: route.summary,
          warnings: route.warnings,
          copyrights: route.copyrights,
        }));
      } else {
        throw new Error(data.error_message || "No route found");
      }
    } catch (error) {
      console.error("Directions error:", error);
      throw error;
    }
  }

  static async getPlaceAutocomplete(
    input: string,
    location?: { latitude: number; longitude: number }
  ) {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;

      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.predictions.map((prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
        }));
      } else {
        throw new Error(data.error_message || "No suggestions found");
      }
    } catch (error) {
      console.error("Autocomplete error:", error);
      throw error;
    }
  }

  static decodePolyline(
    encoded: string
  ): { latitude: number; longitude: number }[] {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  static stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  }
}
