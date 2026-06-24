import { getInquiries, deleteInquiry } from "../../data/store";
import type { Route } from "./+types/inquiries";

// 获取咨询列表
export async function loader({ context }: Route.LoaderArgs) {
  return Response.json(await getInquiries(context.cloudflare.env.DB));
}

// 删除咨询
export async function action({ request, context }: Route.ActionArgs) {
  const { id } = (await request.json()) as { id: string };
  await deleteInquiry(context.cloudflare.env.DB, id);
  return Response.json({ success: true });
}