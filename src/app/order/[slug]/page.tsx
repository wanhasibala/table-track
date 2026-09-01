import React, { Suspense } from "react";
import OrderMenuPage from "./[tableId]/order";

const page = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading menu...</div>}>
      <OrderMenuPage />
    </Suspense>
  );
};

export default page;
