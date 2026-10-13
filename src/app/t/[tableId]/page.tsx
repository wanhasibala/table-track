import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

interface Props {
  params: Promise<{ tableId: string }>;
}

export default async function NfcTableRedirectPage({ params }: Props) {
  const { tableId } = await params;

  if (!tableId) {
    notFound();
  }

  // Find table and associated merchant
  const table = await prisma.table_spot.findUnique({
    where: { id: tableId },
    include: {
      tenant: true,
      orders: {
        where: {
          status: {
            in: ["pending", "awaiting_payment", "confirmed", "preparing", "served"],
          },
        },
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
  });

  if (!table || !table.tenant || !table.is_active || !table.tenant.is_active) {
    notFound();
  }

  const activeOrder = table.orders[0];

  // If there's an active order awaiting payment, navigate directly to payment
  if (activeOrder && (activeOrder.status === "awaiting_payment" || activeOrder.payment_status === "awaiting_payment")) {
    redirect(`/order/payment?orderId=${activeOrder.id}`);
  }

  // If there's an active confirmed/preparing order, navigate to status
  if (activeOrder && activeOrder.payment_status === "paid") {
    redirect(`/order/status?orderId=${activeOrder.id}`);
  }

  // Default: Open customer digital menu for this table
  redirect(`/order/${table.tenant.slug}/${table.id}`);
}
