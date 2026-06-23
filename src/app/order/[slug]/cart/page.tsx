import React, { Suspense } from "react";
import CartPageRedirect from "./cart";

const page = () => {
  return (
    <Suspense fallback={<div>Loading order details...</div>}>
      <CartPageRedirect />
    </Suspense>
  );
};

export default page;
