import { getNotifications } from "@/actions/dashboard";
import { getSession } from "@/actions/auth";
import { AdminLayoutClient } from "./admin-layout-client";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [notifications, session] = await Promise.all([
    getNotifications(),
    getSession(),
  ]);

  const unreadCount = notifications.length;

  return (
    <AdminLayoutClient session={session} unreadCount={unreadCount}>
      {children}
    </AdminLayoutClient>
  );
}
