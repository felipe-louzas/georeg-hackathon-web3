import { GeocodedFeature } from "../services/geocoding";

export const geocodedFeatures: {
  [id: string | number]: Promise<GeocodedFeature>;
} = {};
