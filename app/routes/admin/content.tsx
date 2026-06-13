import type { Route } from "./+types/content";
import { getContent, updateContent, resetContent } from "../../data/store";
import type { SiteContent } from "../../data/content";
import { useState } from "react";
import { Form, useNavigation } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "内容管理 - 管理后台" }];
}

export function loader({ }: Route.LoaderArgs) {
  return getContent();
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "reset") {
    resetContent();
    return { success: true, message: "已恢复默认内容" };
  }

  if (intent === "save") {
    const contentJson = formData.get("content") as string;
    try {
      const content = JSON.parse(contentJson) as SiteContent;
      updateContent(content);
      return { success: true, message: "保存成功" };
    } catch {
      return { error: "数据格式错误" };
    }
  }

  return { error: "未知操作" };
}

export default function ContentEditor({ loaderData, actionData }: Route.ComponentProps) {
  const content = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [editedContent, setEditedContent] = useState<SiteContent>(content);
  const [activeTab, setActiveTab] = useState<string>("hero");
  const [message, setMessage] = useState<string | null>(
    actionData?.success ? actionData.message : actionData?.error || null
  );

  const tabs = [
    { key: "hero", label: "首页横幅" },
    { key: "courses", label: "课程管理" },
    { key: "about", label: "关于我们" },
    { key: "contact", label: "联系方式" },
    { key: "footer", label: "页脚信息" },
  ];

  const updateField = (path: string, value: string) => {
    const keys = path.split(".");
    const newContent = { ...editedContent };
    let current: any = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditedContent(newContent);
  };

  const updateCourse = (index: number, field: string, value: string) => {
    const newContent = { ...editedContent };
    (newContent.courses[index] as any)[field] = value;
    setEditedContent(newContent);
  };

  const updateCourseFeature = (courseIndex: number, featureIndex: number, value: string) => {
    const newContent = { ...editedContent };
    newContent.courses[courseIndex].features[featureIndex] = value;
    setEditedContent(newContent);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
        <div className="flex items-center gap-3">
          <Form method="post">
            <input type="hidden" name="intent" value="reset" />
            <button
              type="submit"
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              恢复默认
            </button>
          </Form>
          <Form method="post">
            <input type="hidden" name="intent" value="save" />
            <input type="hidden" name="content" value={JSON.stringify(editedContent)} />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "保存中..." : "保存修改"}
            </button>
          </Form>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${actionData?.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {/* Hero Tab */}
        {activeTab === "hero" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">首页横幅设置</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主标题</label>
              <input
                value={editedContent.hero.title}
                onChange={(e) => updateField("hero.title", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
              <textarea
                value={editedContent.hero.subtitle}
                onChange={(e) => updateField("hero.subtitle", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">按钮文字</label>
              <input
                value={editedContent.hero.ctaText}
                onChange={(e) => updateField("hero.ctaText", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-8">
            <h3 className="font-semibold text-gray-900 mb-4">课程管理</h3>
            {editedContent.courses.map((course, ci) => (
              <div key={course.id} className="border border-gray-200 rounded-xl p-6 space-y-4">
                <h4 className="font-medium text-gray-900">
                  {["初中小学美术", "吉他兴趣课", "趣味书法", "舞蹈培训"][ci]}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                    <input
                      value={course.title}
                      onChange={(e) => updateCourse(ci, "title", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
                    <input
                      value={course.subtitle}
                      onChange={(e) => updateCourse(ci, "subtitle", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
                  <textarea
                    value={course.description}
                    onChange={(e) => updateCourse(ci, "description", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">课程特色</label>
                  <div className="space-y-2">
                    {course.features.map((f, fi) => (
                      <input
                        key={fi}
                        value={f}
                        onChange={(e) => updateCourseFeature(ci, fi, e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder={`特色 ${fi + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">关于我们</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                value={editedContent.about.title}
                onChange={(e) => updateField("about.title", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={editedContent.about.description}
                onChange={(e) => updateField("about.description", e.target.value)}
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">联系方式</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "phone", label: "电话" },
                { key: "email", label: "邮箱" },
                { key: "wechat", label: "微信" },
                { key: "address", label: "地址" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={(editedContent.contact as any)[key]}
                    onChange={(e) => updateField(`contact.${key}`, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === "footer" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">页脚信息</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标语</label>
              <input
                value={editedContent.footer.slogan}
                onChange={(e) => updateField("footer.slogan", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">版权信息</label>
              <input
                value={editedContent.footer.copyright}
                onChange={(e) => updateField("footer.copyright", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}