interface Props { params: Promise<{ tenantId: string }> }
export default async function Page({ params }: Props) {
  const { tenantId } = await params;
  return (
    <main style={{padding:20}}>
      <h1>Payment Process</h1>
      <p>Payment processing UI for cashier.</p>
    </main>
  );
}
