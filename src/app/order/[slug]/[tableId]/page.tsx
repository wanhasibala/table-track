import Link from 'next/link';

interface Props {
  params: { slug: string; tableId: string };
}

export default function Page({ params }: Props) {
  const { slug, tableId } = params;
  return (
    <main style={{padding:20}}>
      <h1>Order — {slug} / {tableId}</h1>
      <p>Customer entry point. Choose from the menu, view cart, or check order status.</p>
      <ul>
        <li><Link href={`/order/${slug}/${tableId}/cart`}>Cart & Checkout</Link></li>
        <li><Link href={`/order/${slug}/${tableId}/status`}>Order Status</Link></li>
        <li><Link href={`/order/${slug}/${tableId}/payment`}>Payment (QRIS)</Link></li>
      </ul>
    </main>
  );
}
