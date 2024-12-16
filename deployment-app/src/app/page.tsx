import { signIn, auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session) {
    return <Link href="/welcome">Welcome</Link>;
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <button type="submit">Signin with GitHub</button>
    </form>
  );
}
