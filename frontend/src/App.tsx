import React, { Suspense } from "react";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./components/ErrorPage";
import MapPage from "./components/map/MapPage";

import "./App.css";

export default function App() {
  return (
    <ErrorBoundary fallback={(error) => <ErrorPage error={error.message} />}>
      <Suspense fallback={<Loader />}>
        <MapPage />
      </Suspense>
    </ErrorBoundary>
  );
}
