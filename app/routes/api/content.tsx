import { getContent, updateContent } from "../../data/store";
import type { Route } from "./+types/content";
import type { SiteContent } from "../../data/content";

// 获取内容
export async function loader({ context }: Route.LoaderArgs) {
  return Response.json(await getContent(context.cloudflare.env.DB));
}

// 更新内容
export async function action({ request, context }: Route.ActionArgs) {
  const body = (await request.json()) as SiteContent;
  await updateContent(context.cloudflare.env.DB, body);
  return Response.json({ success: true });
}