interface Props { params: { tenantId: string } }
export default function Page({ params }: Props) {
  return (
    <main style={{padding:20}}>
      <h1>Order Queue</h1>
      <p>Shows incoming orders for kitchen staff.</p>
    </main>
  );
}
