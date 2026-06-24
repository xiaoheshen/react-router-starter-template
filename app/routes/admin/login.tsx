import type { Route } from "./+types/login";
import { Form, useNavigation } from "react-router";
import { verifyAdmin } from "../../data/store";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "管理员登录 - 艺术培训工作室" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const db = context.cloudflare.env.DB;

  if (await verifyAdmin(db, password)) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie":
          "admin_token=authenticated; Path=/; SameSite=Lax; Max-Age=86400",
      },
    });
  }
  return { error: "密码错误" };
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // 检查 actionData 是否包含 success 字段（来自 Response JSON）
  const isSuccess =
    actionData && typeof actionData === "object" && "success" in actionData
      ? (actionData as { success: boolean }).success
      : false;
  const error =
    actionData && typeof actionData === "object" && "error" in actionData
      ? (actionData as { error: string }).error
      : undefined;

  // 登录成功后，前端跳转（Cookie 已由 Response 设置）
  if (isSuccess && typeof window !== "undefined") {
    window.location.href = "/admin";
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">艺</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">管理后台</h1>
            <p className="text-sm text-gray-500 mt-1">请输入管理员密码</p>
          </div>

          <Form method="post" className="space-y-4">
            <div>
              <input
                type="password"
                name="password"
                placeholder="请输入密码"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "登录中..." : "登录"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}