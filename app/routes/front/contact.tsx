import type { Route } from "./+types/contact";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getContent, addInquiry } from "../../data/store";
import { Form, redirect, useNavigation } from "react-router";
import { ImageViewer } from "../../components/ImageViewer";
import { validateInquiry } from "../../data/validation";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "联系我们 - 海艺画社" },
    { name: "description", content: "预约免费试听课，联系我们了解更多" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  return getContent(context.cloudflare.env.DB);
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const course = formData.get("course") as string;
  const message = formData.get("message") as string;

  if (!name || !phone) {
    return { error: "请填写姓名和电话" };
  }

  // 数据验证
  const validation = validateInquiry({ name, phone, course, message });
  if (!validation.valid) {
    return { error: validation.errors.map((e) => e.message).join("；") };
  }

  await addInquiry(context.cloudflare.env.DB, { name, phone, course, message });
  return redirect("/contact?success=1");
}

export default function Contact({ loaderData }: Route.ComponentProps) {
  const { contact, footer } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{contact.title}</h1>
          <p className="text-lg text-gray-500">{contact.description}</p>
        </div>
      </section>

      {/* 联系表单 + 信息 */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 表单 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">预约试听课</h2>
              <Form method="post" className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    家长姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="请输入您的手机号码"
                  />
                </div>
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                    意向课程
                  </label>
                  <select
                    id="course"
                    name="course"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                  >
                    <option value="">请选择课程</option>
                    <option value="art">初中小学美术</option>
                    <option value="guitar">吉他兴趣课</option>
                    <option value="calligraphy">趣味书法</option>
                    <option value="dance">舞蹈培训</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    留言
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    placeholder="请输入您想咨询的问题"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? "提交中..." : "提交预约"}
                </button>
              </Form>
            </div>

            {/* 联系信息 */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">联系方式</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">📞</span>
                    <div>
                      <div className="font-medium text-gray-900">电话</div>
                      <div className="text-gray-500">{contact.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">📧</span>
                    <div>
                      <div className="font-medium text-gray-900">邮箱</div>
                      <div className="text-gray-500">{contact.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">💬</span>
                    <div>
                      <div className="font-medium text-gray-900">微信</div>
                      <div className="text-gray-500">{contact.wechat}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">📍</span>
                    <div>
                      <div className="font-medium text-gray-900">地址</div>
                      <div className="text-gray-500">{contact.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 地图占位 */}
              {contact.mapImage ? (
                <ImageViewer
                  src={contact.mapImage}
                  alt="地图"
                  className="aspect-[4/3] object-cover rounded-2xl w-full"
                />
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🗺️</span>
                    <span className="text-gray-400 text-sm">地图区域</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer slogan={footer.slogan} copyright={footer.copyright} />
    </div>
  );
}