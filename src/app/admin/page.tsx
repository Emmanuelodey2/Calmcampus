import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminPage from "./admin";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) redirect("/login");

  return <AdminPage />;
}