import Link from 'next/link';

export default function AuthIndex() {
  return (
    <main style={{padding:20}}>
      <h1>Auth</h1>
      <ul>
        <li><Link href="/auth/login">Login</Link></li>
        <li><Link href="/auth/register">Register</Link></li>
      </ul>
    </main>
  );
}
