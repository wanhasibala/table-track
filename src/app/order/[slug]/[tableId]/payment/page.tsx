interface Props { params: { slug: string; tableId: string } }
export default function Page({ params }: Props) {
  return (
    <main style={{padding:20}}>
      <h1>Payment (QRIS)</h1>
      <p>Show QR/Payment flow for the current order.</p>
    </main>
  );
}
