import { verifyAdmin } from "../../data/store";
import type { Route } from "./+types/login";

export async function action({ request }: Route.ActionArgs) {
  const { password } = (await request.json()) as { password: string };
  if (verifyAdmin(password)) {
    return Response.json({ success: true, token: "authenticated" });
  }
  return Response.json({ success: false, error: "密码错误" }, { status: 401 });
}