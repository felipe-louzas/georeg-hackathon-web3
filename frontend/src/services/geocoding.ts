export type GeocodedFeature = {
  tokens: string[];
  cells: GeoJSON.MultiPolygon;
  poly: GeoJSON.Polygon;
  lat: string;
  lng: string;
};

export async function geocode(
  geometry: GeoJSON.Geometry
): Promise<GeocodedFeature> {
  const resp = await fetch(
    `https://${process.env.REACT_APP_BACKEND_HOST}/geocode`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geometry),
    }
  );
  const json = await resp.json();
  return json;
}
