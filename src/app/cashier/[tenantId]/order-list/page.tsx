interface Props { params: Promise<{ tenantId: string }> }
export default async function Page({ params }: Props) {
  const { tenantId } = await params;
  return (
    <main style={{padding:20}}>
      <h1>Cashier — Order List</h1>
      <p>List of orders ready for payment or review.</p>
    </main>
  );
}
