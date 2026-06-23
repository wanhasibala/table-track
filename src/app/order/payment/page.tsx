import React, { Suspense } from "react";
import PaymentPage from "./payment";

const page = () => {
  return (
    <Suspense fallback={<div>Loading order details...</div>}>
      <PaymentPage />
    </Suspense>
  );
};

export default page;
