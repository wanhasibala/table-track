interface Props { params: Promise<{ tenantId: string }> }
export default async function Page({ params }: Props) {
  const { tenantId } = await params;
  return (
    <main style={{padding:20}}>
      <h1>Order Queue</h1>
      <p>Shows incoming orders for kitchen staff.</p>
    </main>
  );
}
