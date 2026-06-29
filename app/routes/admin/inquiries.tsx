// 咨询管理页面 - 增强版
// 支持分页、搜索筛选、状态更新、批量操作、数据表格展示

import type { Route } from "./+types/inquiries";
import { getInquiries, deleteInquiry, batchDeleteInquiries, updateInquiryStatus } from "../../data/store";
import type { Inquiry } from "../../data/store";
import { Form, useNavigation, useSubmit } from "react-router";
import { useState, useCallback, useEffect } from "react";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "客户咨询 - 管理后台" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "15", 10);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";

  return getInquiries(context.cloudflare.env.DB, { page, pageSize, search, status });
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    const id = formData.get("id") as string;
    if (id) await deleteInquiry(db, id);
    return { success: true, message: "咨询已删除" };
  }

  if (intent === "batchDelete") {
    const ids = (formData.get("ids") as string).split(",").filter(Boolean);
    if (ids.length > 0) {
      await batchDeleteInquiries(db, ids);
    }
    return { success: true, message: `已删除 ${ids.length} 条咨询` };
  }

  if (intent === "updateStatus") {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    if (id && status) {
      try {
        await updateInquiryStatus(db, id, status);
        return { success: true, message: "状态已更新" };
      } catch (err: any) {
        return { error: err.message };
      }
    }
  }

  return { error: "未知操作" };
}

const courseLabels: Record<string, string> = {
  art: "初中小学美术",
  guitar: "吉他兴趣课",
  calligraphy: "趣味书法",
  dance: "舞蹈培训",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  contacted: { label: "已联系", color: "bg-blue-50 text-blue-700 border-blue-200" },
  converted: { label: "已转化", color: "bg-green-50 text-green-700 border-green-200" },
  closed: { label: "已关闭", color: "bg-gray-50 text-gray-500 border-gray-200" },
};

export default function Inquiries({ loaderData, actionData }: Route.ComponentProps) {
  const { items: inquiries, total, page, pageSize, totalPages } = loaderData;
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  // 搜索状态
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 同步 actionData 到消息状态
  useEffect(() => {
    if (actionData?.success) {
      setMessage({ type: "success", text: actionData.message });
    } else if (actionData?.error) {
      setMessage({ type: "error", text: actionData.error });
    }
  }, [actionData]);

  // 消息自动消失
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("search", searchInput.trim());
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", "1");
    submit(params, { method: "get" });
  }, [searchInput, statusFilter, submit]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams();
      if (searchInput.trim()) params.set("search", searchInput.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(newPage));
      submit(params, { method: "get" });
    },
    [searchInput, statusFilter, submit]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === inquiries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inquiries.map((i) => i.id)));
    }
  }, [selectedIds, inquiries]);

  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户咨询</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条咨询记录</p>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="搜索姓名、电话、留言..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
          >
            <option value="">全部状态</option>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>

          {(searchInput || statusFilter) && (
            <button
              onClick={() => {
                setSearchInput("");
                setStatusFilter("");
                submit({}, { method: "get" });
              }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 操作提示 */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${message.type === "success"
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-700"
            }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-current opacity-50 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700">
            已选择 {selectedIds.size} 条记录
          </span>
          <div className="flex gap-2">
            <Form method="post">
              <input type="hidden" name="intent" value="batchDelete" />
              <input type="hidden" name="ids" value={Array.from(selectedIds).join(",")} />
              <button
                type="submit"
                className="px-4 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (!confirm(`确定删除选中的 ${selectedIds.size} 条咨询吗？`)) {
                    return false;
                  }
                }}
              >
                批量删除
              </button>
            </Form>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      {inquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-4xl block mb-4">📭</span>
          <p className="text-gray-500">
            {searchInput || statusFilter ? "没有找到匹配的咨询记录" : "暂无客户咨询"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === inquiries.length && inquiries.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">电话</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">意向课程</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">留言</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">提交时间</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(inquiry.id) ? "bg-blue-50/30" : ""
                      }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inquiry.id)}
                        onChange={() => toggleSelect(inquiry.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {inquiry.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {inquiry.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full whitespace-nowrap">
                        {courseLabels[inquiry.course] || inquiry.course || "未选择"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                      <div className="truncate" title={inquiry.message}>
                        {inquiry.message || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Form method="post" className="inline-block">
                        <input type="hidden" name="intent" value="updateStatus" />
                        <input type="hidden" name="id" value={inquiry.id} />
                        <select
                          name="status"
                          value={inquiry.status}
                          onChange={(e) => {
                            const form = e.target.closest("form");
                            if (form) submit(form);
                          }}
                          className={`text-xs px-2 py-1 rounded-full border cursor-pointer outline-none ${statusConfig[inquiry.status]?.color || "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                        >
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                      </Form>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(inquiry.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-6 py-4">
                      <Form method="post" className="inline-block">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={inquiry.id} />
                        <button
                          type="submit"
                          className="text-sm text-red-500 hover:text-red-700 transition-colors"
                          onClick={(e) => {
                            if (!confirm("确定删除此咨询吗？")) e.preventDefault();
                          }}
                        >
                          删除
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-sm text-gray-500">
                第 {page}/{totalPages} 页，共 {total} 条
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>

                {getPaginationRange().map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item as number)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === item
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}