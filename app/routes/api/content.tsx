import { getContent, updateContent } from "../../data/store";
import type { Route } from "./+types/content";
import type { SiteContent } from "../../data/content";

// 获取内容
export async function loader({ }: Route.LoaderArgs) {
  return Response.json(getContent());
}

// 更新内容
export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as SiteContent;
  updateContent(body);
  return Response.json({ success: true });
}