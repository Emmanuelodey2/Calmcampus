import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardPage from "./dash";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  console.log(token)

  if (!token) redirect("/login");

  return <DashboardPage />;
}
