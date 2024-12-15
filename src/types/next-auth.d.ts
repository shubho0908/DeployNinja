import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    username?: string;
  }

  interface JWT {
    accessToken?: string;
    username?: string;
  }
}
