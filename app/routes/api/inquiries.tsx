import { getInquiries, deleteInquiry } from "../../data/store";
import type { Route } from "./+types/inquiries";

// 获取咨询列表
export async function loader({ }: Route.LoaderArgs) {
  return Response.json(getInquiries());
}

// 删除咨询
export async function action({ request }: Route.ActionArgs) {
  const { id } = (await request.json()) as { id: string };
  deleteInquiry(id);
  return Response.json({ success: true });
}