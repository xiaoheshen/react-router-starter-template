import type { Route } from "./+types/dashboard";
import { getContent, getInquiries } from "../../data/store";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "仪表盘 - 管理后台" }];
}

export function loader({ }: Route.LoaderArgs) {
  const content = getContent();
  const inquiries = getInquiries();
  return {
    courseCount: content.courses.length,
    inquiryCount: inquiries.length,
    todayInquiries: inquiries.filter(
      (i) => new Date(i.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { courseCount, inquiryCount, todayInquiries } = loaderData;

  const stats = [
    {
      label: "课程总数",
      value: courseCount,
      icon: "📚",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "总咨询数",
      value: inquiryCount,
      icon: "📨",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "今日咨询",
      value: todayInquiries,
      icon: "📅",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">仪表盘</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/admin/content"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">编辑网站内容</div>
              <div className="text-sm text-gray-500">修改首页文案、课程介绍等</div>
            </div>
          </a>
          <a
            href="/admin/inquiries"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">查看客户咨询</div>
              <div className="text-sm text-gray-500">查看和管理客户提交的预约信息</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}