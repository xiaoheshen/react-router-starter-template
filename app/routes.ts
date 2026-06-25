import { type RouteConfig, index, route, layout, prefix } from "@react-router/dev/routes";

export default [
  // 前台页面
  index("routes/front/home.tsx"),
  route("courses", "routes/front/courses.tsx"),
  route("about", "routes/front/about.tsx"),
  route("contact", "routes/front/contact.tsx"),

  // 后台管理
  ...prefix("admin", [
    layout("routes/admin/layout.tsx", [
      index("routes/admin/dashboard.tsx"),
      route("content", "routes/admin/content.tsx"),
      route("inquiries", "routes/admin/inquiries.tsx"),
    ]),
  ]),
  route("admin/login", "routes/admin/login.tsx"),

  // API 路由
  route("api/content", "routes/api/content.tsx"),
  route("api/inquiries", "routes/api/inquiries.tsx"),
  route("api/login", "routes/api/login.tsx"),
  route("api/upload", "routes/api/upload.tsx"),
] satisfies RouteConfig;