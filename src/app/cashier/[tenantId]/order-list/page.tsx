interface Props { params: { tenantId: string } }
export default function Page({ params }: Props) {
  return (
    <main style={{padding:20}}>
      <h1>Cashier — Order List</h1>
      <p>List of orders ready for payment or review.</p>
    </main>
  );
}
