import type { Route } from "./+types/inquiries";
import { getInquiries, deleteInquiry } from "../../data/store";
import { Form, redirect, useNavigation } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "客户咨询 - 管理后台" }];
}

export function loader({ }: Route.LoaderArgs) {
  return getInquiries();
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  if (id) {
    deleteInquiry(id);
  }
  return null;
}

export default function Inquiries({ loaderData }: Route.ComponentProps) {
  const inquiries = loaderData;
  const navigation = useNavigation();

  const courseLabels: Record<string, string> = {
    art: "初中小学美术",
    guitar: "吉他兴趣课",
    calligraphy: "趣味书法",
    dance: "舞蹈培训",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">客户咨询</h1>

      {inquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-4xl block mb-4">📭</span>
          <p className="text-gray-500">暂无客户咨询</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">电话</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">意向课程</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">留言</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">提交时间</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {inquiry.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inquiry.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {courseLabels[inquiry.course] || inquiry.course || "未选择"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {inquiry.message || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(inquiry.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-6 py-4">
                      <Form method="post">
                        <input type="hidden" name="id" value={inquiry.id} />
                        <button
                          type="submit"
                          className="text-sm text-red-500 hover:text-red-700 transition-colors"
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
        </div>
      )}
    </div>
  );
}