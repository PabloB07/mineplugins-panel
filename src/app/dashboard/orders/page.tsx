import { redirect } from "next/navigation";

export default async function DashboardOrdersPage() {
  // Redirect to main orders page
  redirect("/orders");
}