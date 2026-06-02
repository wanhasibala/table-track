interface Props { params: { slug: string; tableId: string } }
export default function Page({ params }: Props) {
  const { slug, tableId } = params;
  return (
    <main style={{padding:20}}>
      <h1>Order Status</h1>
      <p>Order status for table <strong>{tableId}</strong> at <strong>{slug}</strong>.</p>
    </main>
  );
}
