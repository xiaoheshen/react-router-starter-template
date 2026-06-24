import { verifyAdmin } from "../../data/store";
import type { Route } from "./+types/login";

export async function action({ request, context }: Route.ActionArgs) {
  const { password } = (await request.json()) as { password: string };
  const db = context.cloudflare.env.DB;
  if (await verifyAdmin(db, password)) {
    return Response.json({ success: true, token: "authenticated" });
  }
  return Response.json({ success: false, error: "密码错误" }, { status: 401 });
}