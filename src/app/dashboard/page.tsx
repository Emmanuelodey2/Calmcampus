import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access")?.value;

  if (!token) redirect("/login");

  return <div>Dashboard</div>;
}
