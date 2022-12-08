import React from "react";
import Loader from "../Loader";
import { GeocodedFeature } from "../../services/geocoding";

import "./DetailPanel.css";

type Props = {
  show: boolean;
  feature?: GeocodedFeature;
};

export default function DetailPanel(props: Props) {
  return (
    <div
      className={`sidebar flex-center right ${props.show ? "" : "collapsed"}`}
    >
      <div className="sidebar-content rounded-rect">
        {props.show ? (
          props.feature ? (
            <FeatureDetails feature={props.feature} />
          ) : (
            <Loader />
          )
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

function FeatureDetails(props: { feature: GeocodedFeature }) {
  return (
    <form>
      <div className="row">
        <div className="col">
          <label>Qtd. Vértices:</label>
          <span>{props.feature.poly.coordinates[0].length - 1}</span>
        </div>
        <div className="col">
          <label>Qtd. Células:</label>
          <span>{props.feature.tokens.length}</span>
        </div>
      </div>
      <div className="mt-3 d-grid">
        <button type="submit" className="btn btn-primary">
          Registrar
        </button>
      </div>
    </form>
  );
}
