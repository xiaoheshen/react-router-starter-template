// 面包屑导航组件
// 根据当前 URL 路径自动生成面包屑层级，显示当前位置

import { useLocation, Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  path: string;
  active: boolean;
}

const pathLabelMap: Record<string, string> = {
  admin: "管理后台",
  content: "内容管理",
  inquiries: "客户咨询",
  login: "管理员登录",
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // 如果没有路径段，返回空
  if (pathSegments.length === 0) return null;

  const items: BreadcrumbItem[] = [];
  let accumulatedPath = "";

  for (const segment of pathSegments) {
    accumulatedPath += `/${segment}`;
    const label = pathLabelMap[segment] || segment;
    items.push({
      label,
      path: accumulatedPath,
      active: accumulatedPath === location.pathname,
    });
  }

  return (
    <nav aria-label="面包屑导航" className="py-3 px-8 border-b border-gray-100 bg-white">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.active ? (
              <span className="text-gray-900 font-medium">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}