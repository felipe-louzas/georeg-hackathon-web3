import React from "react";
import Loader from "../Loader";
import { useCelo } from "@celo/react-celo";
import { GeocodedFeature } from "../../services/geocoding";
import { Contract } from "ethers";
import ImovelRegistry from "../../web3/types/ImovelRegistry.json";

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
  const { address, kit } = useCelo();

  function onRegisterClick() {
    const stableToken = new Contract(
      "0xE6dE4daff89851E371506ee49148e55a2D1266F9",
      abi,
      wallet
    );

    const counter = new Contract(
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      ImovelRegistry.abi,
      provider?.getSigner()
    ) as Counter;

    kit.contracts.connection.sendTransaction();
    return false;
  }

  return (
    <form className="d-flex flex-column h-100">
      <div className="mb-3 pb-2 border-bottom">
        <h5 className="card-title">Registrar imóvel</h5>
      </div>
      <div className="flex-fill">
        <div className="row mb-2">
          <div className="col">
            <label className="small">Latitude:</label>
            <div className="">{props.feature.lat}</div>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col">
            <label className="small ">Longitude:</label>
            <div className="">{props.feature.lng}</div>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col">
            <label className="small">Qtd. Vértices:</label>
            <div className="">
              {props.feature.poly.coordinates[0].length - 1}
            </div>
          </div>
          <div className="col">
            <label className="small">Qtd. Células:</label>
            <div className="">{props.feature.tokens.length}</div>
          </div>
        </div>
      </div>
      <div className="d-grid">
        {!address ? (
          <span className="small text-danger">
            Conectar wallet para registrar imóvel
          </span>
        ) : (
          <></>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!address}
          onClick={onRegisterClick}
        >
          Registrar
        </button>
      </div>
    </form>
  );
}
