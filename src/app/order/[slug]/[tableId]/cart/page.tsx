import Link from 'next/link';

interface Props { params: { slug: string; tableId: string } }
export default function Page({ params }: Props) {
  const { slug, tableId } = params;
  return (
    <main style={{padding:20}}>
      <h1>Cart & Checkout</h1>
      <p>Cart for table <strong>{tableId}</strong> at <strong>{slug}</strong>.</p>
      <Link href={`/order/${slug}/${tableId}`}>Back to Menu</Link>
    </main>
  );
}
