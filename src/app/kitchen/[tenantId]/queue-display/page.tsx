interface Props { params: Promise<{ tenantId: string }> }
export default async function Page({ params }: Props) {
  const { tenantId } = await params;
  return (
    <main style={{padding:20}}>
      <h1>Queue Display</h1>
      <p>Large-format queue/overview for the kitchen screen.</p>
    </main>
  );
}
