// 咨询管理 API 路由
// 支持分页查询、搜索筛选、状态更新、单条删除和批量删除

import { getInquiries, deleteInquiry, batchDeleteInquiries, updateInquiryStatus } from "../../data/store";
import type { Route } from "./+types/inquiries";

// 获取咨询列表（支持分页、搜索、筛选）
export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";

  const result = await getInquiries(context.cloudflare.env.DB, {
    page,
    pageSize,
    search,
    status,
  });

  return Response.json(result);
}

// 咨询操作：DELETE 删除单条、PATCH 更新状态、POST 批量删除
export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const method = request.method;

  try {
    if (method === "DELETE") {
      const { id } = (await request.json()) as { id: string };
      if (!id) {
        return Response.json({ error: "缺少咨询ID" }, { status: 400 });
      }
      await deleteInquiry(db, id);
      return Response.json({ success: true, message: "咨询已删除" });
    }

    if (method === "PATCH") {
      const { id, status } = (await request.json()) as { id: string; status: string };
      if (!id || !status) {
        return Response.json({ error: "缺少必要参数" }, { status: 400 });
      }
      try {
        await updateInquiryStatus(db, id, status);
        return Response.json({ success: true, message: "状态已更新" });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }

    if (method === "POST") {
      // 批量删除
      const { action, ids } = (await request.json()) as { action: string; ids: string[] };
      if (action === "delete" && ids?.length > 0) {
        await batchDeleteInquiries(db, ids);
        return Response.json({ success: true, message: `已删除 ${ids.length} 条咨询` });
      }
      return Response.json({ error: "无效操作" }, { status: 400 });
    }

    return Response.json({ error: "不支持的请求方法" }, { status: 405 });
  } catch (err: any) {
    return Response.json({ error: err.message || "操作失败" }, { status: 500 });
  }
}