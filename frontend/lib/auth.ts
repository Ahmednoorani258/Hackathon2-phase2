import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
});

// ✅ Session type
export type AuthSession = typeof auth.$Infer.Session;

// ✅ User type (FIXED)
export type AuthUser = typeof auth.$Infer.Session["user"];
