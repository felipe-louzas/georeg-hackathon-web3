import s2 from "@radarlabs/s2";
import GeoJSON from "geojson";
import { Request, Response } from "express";

function handlePost(req: Request, res: Response) {
  const geometry: GeoJSON.Geometry = req.body;

  if (geometry.type !== "Polygon") {
    res.status(400).json({
      error: "geometry precisa ser um objeto GeoJSON do tipo Polígono",
    });
    return;
  }

  const loopLLs: number[][] = geometry.coordinates[0].slice(1);

  const s2LLs = loopLLs.map(([lng, lat]) => new s2.LatLng(lat, lng));
  const covering = s2.RegionCoverer.getCovering(s2LLs, {
    min: 0,
    max: 24,
    max_cells: 300,
  });

  if (!covering) {
    res.json([]);
    return;
  }

  const polyLine = new s2.Polyline(s2LLs);
  const cells = getMultiPolyForCells(covering.cellIds());

  res.json({
    tokens: covering.tokens(),
    cells: cells,
    poly: geometry,
    lat: polyLine.getCentroid().latitude(),
    lng: polyLine.getCentroid().longitude(),
  });
}

function getMultiPolyForCells(cellIds: s2.CellId[]) {
  const poligons = cellIds.map((cid) => getPolygonForCell(cid));

  return {
    type: "MultiPolygon",
    coordinates: poligons,
  };
}

function getPolygonForCell(cellId: s2.CellId) {
  const cell = new s2.Cell(cellId);

  const v0 = cell.getVertex(0);
  const v1 = cell.getVertex(1);
  const v2 = cell.getVertex(2);
  const v3 = cell.getVertex(3);

  const ringVertexArr = [v0, v1, v2, v3, v0];

  const linearRing = ringVertexArr
    .map((v) => new s2.LatLng(v).normalized())
    .map((latLng) => [latLng.longitude(), latLng.latitude()]);

  return [linearRing];
}

export default {
  handlePost: handlePost,
};
