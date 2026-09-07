import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk & Daftar Akun Nata",
  description:
    "Masuk ke dashboard manajemen resto Nata atau daftar akun baru untuk mulai menggunakan menu digital QR code dan POS kasir UMKM.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
