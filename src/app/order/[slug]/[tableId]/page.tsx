import React, { Suspense } from 'react'
import OrderMenuPage from './order'

const page = () => {
  return (
    <Suspense fallback={<div>Loading order details...</div>}>
        <OrderMenuPage />
      </Suspense>
  )
}

export default page