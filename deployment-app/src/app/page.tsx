import { auth } from "@/auth";
import Link from "next/link";
import Login from "./web-components/Login";

export default async function Home() {
  const session = await auth();

  if (session) {
    return <Link href="/dashboard">Dashboard</Link>;
  }

  return (
    <>
      <Login />
    </>
  );
}
