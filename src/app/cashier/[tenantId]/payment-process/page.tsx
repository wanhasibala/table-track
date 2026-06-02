interface Props { params: { tenantId: string } }
export default function Page({ params }: Props) {
  return (
    <main style={{padding:20}}>
      <h1>Payment Process</h1>
      <p>Payment processing UI for cashier.</p>
    </main>
  );
}
