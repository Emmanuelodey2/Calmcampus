import DashboardPage from "./dash";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Page() {
  const token = cookies().get("access")?.value;

  if (!token) redirect("/login");

  return <DashboardPage />;
}