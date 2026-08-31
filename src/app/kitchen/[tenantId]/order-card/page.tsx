interface Props { params: Promise<{ tenantId: string }> }
export default async function Page({ params }: Props) {
  const { tenantId } = await params;
  return (
    <main style={{padding:20}}>
      <h1>Order Card</h1>
      <p>Card view for a selected order.</p>
    </main>
  );
}
