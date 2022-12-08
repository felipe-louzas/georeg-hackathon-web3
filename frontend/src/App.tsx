import React, { Suspense } from "react";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./components/ErrorPage";

import "./App.css";

export default function App() {
  return (
    <ErrorBoundary fallback={(error) => <ErrorPage error={error.message} />}>
      <Suspense fallback={<Loader />}>
        <div></div>
      </Suspense>
    </ErrorBoundary>
  );
}
