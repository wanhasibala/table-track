interface Props { params: { tenantId: string } }
export default function Page({ params }: Props) {
  return (
    <main style={{padding:20}}>
      <h1>Order Card</h1>
      <p>Card view for a selected order.</p>
    </main>
  );
}
