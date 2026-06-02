import Link from 'next/link';

export default function Layout({ children, params }: any) {
  const tenantId = params?.tenantId ?? 'tenant';
  return (
    <div style={{display:'flex',gap:20}}>
      <nav style={{width:220,padding:20,borderRight:'1px solid #ddd'}}>
        <h3>Kitchen — {tenantId}</h3>
        <ul>
          <li><Link href={`/kitchen/${tenantId}/order-queue`}>Order Queue</Link></li>
          <li><Link href={`/kitchen/${tenantId}/order-card`}>Order Card</Link></li>
          <li><Link href={`/kitchen/${tenantId}/queue-display`}>Queue Display</Link></li>
        </ul>
      </nav>
      <section style={{flex:1,padding:20}}>{children}</section>
    </div>
  );
}
