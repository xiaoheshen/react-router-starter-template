import type { Route } from "./+types/login";
import { Form, redirect, useNavigation, useSearchParams } from "react-router";
import { verifyAdmin } from "../../data/store";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "管理员登录 - 艺术培训工作室" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;

  if (verifyAdmin(password)) {
    // 简单的 cookie-based session
    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      `admin_token=authenticated; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    return redirect("/admin", { headers });
  }
  return { error: "密码错误" };
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const error = actionData?.error;

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