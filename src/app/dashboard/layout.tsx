import Link from 'next/link';

export default function Layout({ children }: any) {
  return (
    <div style={{display:'flex',gap:20}}>
      <nav style={{width:260,padding:20,borderRight:'1px solid #ddd'}}>
        <h2>Owner Dashboard</h2>
        <ul>
          <li><Link href="/dashboard/overview">Overview</Link></li>
          <li><Link href="/dashboard/menu-mgmt">Menu Management</Link></li>
          <li><Link href="/dashboard/table-mgmt">Table Management</Link></li>
          <li><Link href="/dashboard/reports">Reports</Link></li>
          <li><Link href="/dashboard/settings">Settings</Link></li>
        </ul>
      </nav>
      <main style={{flex:1,padding:20}}>{children}</main>
    </div>
  );
}
