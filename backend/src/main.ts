import express from "express";
import cors from "cors";

import { Router } from "express";
import s2geocode from "./s2geocode";

const app = express();

const route = Router();

app.use(express.json());
app.use(cors());

route.post("/geocode", s2geocode.geocode);
route.post("/geocodeArea", s2geocode.geocodeArea);
route.post("/drawCells", s2geocode.drawCells);

app.use(route);
app.listen(5000, () => "server running on port 5000");
