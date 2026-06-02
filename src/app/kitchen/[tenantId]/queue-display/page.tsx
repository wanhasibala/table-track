interface Props { params: { tenantId: string } }
export default function Page({ params }: Props) {
  return (
    <main style={{padding:20}}>
      <h1>Queue Display</h1>
      <p>Large-format queue/overview for the kitchen screen.</p>
    </main>
  );
}
