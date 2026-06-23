import React, { Suspense } from "react";
import OrderStatusPage from "./status";

const page = () => {
  return (
    <Suspense fallback={<div>Loading order details...</div>}>
      <OrderStatusPage />
    </Suspense>
  );
};

export default page;
