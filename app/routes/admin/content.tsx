import type { Route } from "./+types/content";
import { getContent, updateContent, resetContent, deleteCourse } from "../../data/store";
import type { SiteContent, Teacher, StudentCase } from "../../data/content";
import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "react-router";
import { ImageUploader } from "../../components/ImageUploader";
import { ImageViewer } from "../../components/ImageViewer";
import { validateSiteContent } from "../../data/validation";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "内容管理 - 管理后台" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  return getContent(context.cloudflare.env.DB);
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const contentType = request.headers.get("content-type") || "";

  // 处理 JSON 请求（保存操作，支持大数据量含 base64 图片）
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      const intent = body.intent as string;

      if (intent === "save") {
        const content = body.content as SiteContent;
        const validation = validateSiteContent(content);
        if (!validation.valid) {
          return { error: validation.errors.map((e) => e.message).join("；") };
        }
        await updateContent(db, content);
        return { success: true, message: "保存成功" };
      }

      if (intent === "reset") {
        await resetContent(db);
        return { success: true, message: "已恢复默认内容" };
      }
    } catch (err: any) {
      return { error: err.message || "数据格式错误" };
    }
  }

  // 处理 FormData 请求（重置、删除课程等简单操作）
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "reset") {
    await resetContent(db);
    return { success: true, message: "已恢复默认内容" };
  }

  if (intent === "deleteCourse") {
    const courseId = formData.get("courseId") as string;
    await deleteCourse(db, courseId);
    return { success: true, message: "课程已删除" };
  }

  return { error: "未知操作" };
}

// 课程渐变色选项
const colorOptions = [
  { value: "from-pink-500 to-rose-500", label: "粉红" },
  { value: "from-amber-500 to-orange-500", label: "琥珀" },
  { value: "from-emerald-500 to-teal-500", label: "翠绿" },
  { value: "from-violet-500 to-purple-500", label: "紫罗兰" },
  { value: "from-blue-500 to-cyan-500", label: "蓝色" },
  { value: "from-red-500 to-pink-500", label: "红色" },
  { value: "from-indigo-500 to-blue-500", label: "靛蓝" },
  { value: "from-yellow-500 to-lime-500", label: "黄色" },
];

export default function ContentEditor({ loaderData, actionData }: Route.ComponentProps) {
  const content = loaderData;
  const saveFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const isSubmitting = saveFetcher.state === "submitting" || resetFetcher.state === "submitting";

  const [editedContent, setEditedContent] = useState<SiteContent>(content);
  const [activeTab, setActiveTab] = useState<string>("hero");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 同步 actionData 的消息（Form 提交的响应）
  useEffect(() => {
    if (actionData?.success) {
      setMessage({ type: "success", text: actionData.message });
    } else if (actionData?.error) {
      setMessage({ type: "error", text: actionData.error });
    }
  }, [actionData]);

  // 同步 saveFetcher 的消息
  useEffect(() => {
    if (saveFetcher.data?.success) {
      setMessage({ type: "success", text: saveFetcher.data.message });
    } else if (saveFetcher.data?.error) {
      setMessage({ type: "error", text: saveFetcher.data.error });
    }
  }, [saveFetcher.data]);

  // 同步 resetFetcher 的消息，并在重置后刷新编辑内容
  useEffect(() => {
    if (resetFetcher.data?.success) {
      setMessage({ type: "success", text: resetFetcher.data.message });
      // 重置后需要重新加载内容，暂时显示提示让用户刷新
    } else if (resetFetcher.data?.error) {
      setMessage({ type: "error", text: resetFetcher.data.error });
    }
  }, [resetFetcher.data]);

  // 自动消失消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const tabs = [
    { key: "hero", label: "首页横幅" },
    { key: "courses", label: "课程管理" },
    { key: "about", label: "关于我们" },
    { key: "contact", label: "联系方式" },
    { key: "footer", label: "页脚信息" },
  ];

  const updateField = useCallback(
    (path: string, value: any) => {
      const keys = path.split(".");
      setEditedContent((prev) => {
        const newContent = structuredClone(prev);
        let current: any = newContent;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newContent;
      });
    },
    []
  );

  const updateCourse = useCallback((index: number, field: string, value: any) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      (newContent.courses[index] as any)[field] = value;
      return newContent;
    });
  }, []);

  const updateCourseFeature = useCallback((courseIndex: number, featureIndex: number, value: string) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].features[featureIndex] = value;
      return newContent;
    });
  }, []);

  const addCourseFeature = useCallback((courseIndex: number) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].features.push("");
      return newContent;
    });
  }, []);

  const removeCourseFeature = useCallback((courseIndex: number, featureIndex: number) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].features.splice(featureIndex, 1);
      return newContent;
    });
  }, []);

  // 教师管理
  const addTeacher = useCallback((courseIndex: number) => {
    setEditedContent((prev) => {
      if (prev.courses[courseIndex].teachers.length >= 3) return prev;
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].teachers.push({ name: "", description: "", image: "" });
      return newContent;
    });
  }, []);

  const removeTeacher = useCallback((courseIndex: number, teacherIndex: number) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].teachers.splice(teacherIndex, 1);
      return newContent;
    });
  }, []);

  const updateTeacher = useCallback(
    (courseIndex: number, teacherIndex: number, field: keyof Teacher, value: string) => {
      setEditedContent((prev) => {
        const newContent = structuredClone(prev);
        newContent.courses[courseIndex].teachers[teacherIndex][field] = value;
        return newContent;
      });
    },
    []
  );

  // 学生案例管理
  const addStudentCase = useCallback((courseIndex: number) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].studentCases.push({ name: "", time: "", workImage: "" });
      return newContent;
    });
  }, []);

  const removeStudentCase = useCallback((courseIndex: number, caseIndex: number) => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses[courseIndex].studentCases.splice(caseIndex, 1);
      return newContent;
    });
  }, []);

  const updateStudentCase = useCallback(
    (courseIndex: number, caseIndex: number, field: keyof StudentCase, value: string) => {
      setEditedContent((prev) => {
        const newContent = structuredClone(prev);
        newContent.courses[courseIndex].studentCases[caseIndex][field] = value;
        return newContent;
      });
    },
    []
  );

  // 添加新课程
  const handleAddCourse = useCallback(() => {
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: "",
        subtitle: "",
        description: "",
        features: [""],
        image: "",
        color: "from-blue-500 to-cyan-500",
        teachers: [],
        studentCases: [],
      });
      return newContent;
    });
  }, []);

  // 删除课程
  const handleDeleteCourse = useCallback((index: number) => {
    if (!confirm("确定要删除该课程吗？相关的教师和学生案例信息也将被删除。")) return;
    setEditedContent((prev) => {
      const newContent = structuredClone(prev);
      newContent.courses.splice(index, 1);
      return newContent;
    });
  }, []);

  // 保存操作 - 使用 useFetcher 以 JSON 格式提交，支持大数据量
  const handleSave = useCallback(() => {
    // 客户端预验证
    const validation = validateSiteContent(editedContent);
    if (!validation.valid) {
      setMessage({ type: "error", text: validation.errors.map((e) => e.message).join("；") });
      return;
    }
    saveFetcher.submit(
      { intent: "save", content: editedContent },
      { method: "post", encType: "application/json" }
    );
  }, [editedContent, saveFetcher]);

  // 重置操作
  const handleReset = useCallback(() => {
    if (!confirm("确定要恢复默认内容吗？所有修改将丢失且不可恢复！")) return;
    resetFetcher.submit(
      { intent: "reset" },
      { method: "post", encType: "application/json" }
    );
  }, [resetFetcher]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {resetFetcher.state === "submitting" ? "恢复中..." : "恢复默认"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saveFetcher.state === "submitting" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                保存中...
              </span>
            ) : (
              "保存修改"
            )}
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-current opacity-50 hover:opacity-100 transition-opacity">
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
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
            <ImageUploader
              label="首页横幅背景图片"
              value={editedContent.hero.backgroundImage}
              onChange={(base64) => updateField("hero.backgroundImage", base64)}
              previewFit="contain"
            />
            {editedContent.hero.backgroundImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">背景预览</label>
                <div
                  className="w-full h-48 rounded-lg border border-gray-200"
                  style={{ backgroundImage: `url(${editedContent.hero.backgroundImage})`, backgroundRepeat: "no-repeat", backgroundSize: "contain", backgroundPosition: "center" }}
                />
              </div>
            )}

            {/* 颜色设置 */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">颜色设置</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: "hero.titleColor", label: "标题颜色", default: "#111827" },
                  { key: "hero.subtitleColor", label: "副标题颜色", default: "#6B7280" },
                  { key: "hero.ctaBgColor", label: "按钮背景色", default: "#2563EB" },
                  { key: "hero.ctaTextColor", label: "按钮文字色", default: "#FFFFFF" },
                ].map(({ key, label, default: def }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(editedContent.hero as any)[key.split(".")[1]] || def}
                        onChange={(e) => updateField(key, e.target.value)}
                        className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={(editedContent.hero as any)[key.split(".")[1]] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono"
                        placeholder={def}
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">课程管理</h3>
              <button
                type="button"
                onClick={handleAddCourse}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + 添加课程
              </button>
            </div>
            {editedContent.courses.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-3">📚</span>
                <p>暂无课程，点击上方"添加课程"按钮创建</p>
              </div>
            )}
            {editedContent.courses.map((course, ci) => (
              <div key={course.id} className="border border-gray-200 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 text-lg">
                    课程 {ci + 1}: {course.title || "未命名课程"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(ci)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    删除课程
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">主题色</label>
                    <select
                      value={course.color}
                      onChange={(e) => updateCourse(ci, "color", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                      {colorOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
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

                {/* 课程宣传图 */}
                <ImageUploader
                  label="课程宣传图"
                  value={course.image}
                  onChange={(base64) => updateCourse(ci, "image", base64)}
                />

                {/* 课程特色 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">课程特色</label>
                    <button
                      type="button"
                      onClick={() => addCourseFeature(ci)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + 添加特色
                    </button>
                  </div>
                  <div className="space-y-2">
                    {course.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <input
                          value={f}
                          onChange={(e) => updateCourseFeature(ci, fi, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder={`特色 ${fi + 1}`}
                        />
                        {course.features.length > 1 && (
                      <button
                            type="button"
                            onClick={() => removeCourseFeature(ci, fi)}
                      className="text-red-400 hover:text-red-600 text-sm"
                 >
                 删除
                </button>
                )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 教师信息 */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      教师信息 ({course.teachers.length}/3)
                    </label>
                    {course.teachers.length < 3 && (
                      <button
                        type="button"
                        onClick={() => addTeacher(ci)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                  >
                        + 添加教师
                      </button>
                    )}
                  </div>
                  {course.teachers.map((teacher, ti) => (
                    <div key={ti} className="border border-gray-100 rounded-lg p-4 mb-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">教师 {ti + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeTeacher(ci, ti)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">姓名</label>
                          <input
                            value={teacher.name}
                            onChange={(e) => updateTeacher(ci, ti, "name", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  placeholder="教师姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">文字介绍</label>
                          <input
                            value={teacher.description}
                            onChange={(e) => updateTeacher(ci, ti, "description", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                            placeholder="简要介绍"
                          />
                        </div>
                      </div>
                      <ImageUploader
                        label="教师照片"
                         value={teacher.image}
                        onChange={(base64) => updateTeacher(ci, ti, "image", base64)}
                  />
                    </div>
                  ))}
              {course.teachers.length === 0 && (
                <p className="text-sm text-gray-400">暂无教师信息，点击上方按钮添加</p>
                  )}
                </div>

                {/* 学生案例 */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      优秀学生案例 ({course.studentCases.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => addStudentCase(ci)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + 添加案例
                    </button>
                  </div>
                  {course.studentCases.map((sc, si) => (
                    <div key={si} className="border border-gray-100 rounded-lg p-4 mb-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">案例 {si + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeStudentCase(ci, si)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">学生姓名</label>
                          <input
                            value={sc.name}
                            onChange={(e) => updateStudentCase(ci, si, "name", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                            placeholder="学生姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">时间</label>
                          <input
                            value={sc.time}
                            onChange={(e) => updateStudentCase(ci, si, "time", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                            placeholder="例如：2024年"
                          />
                        </div>
                      </div>
                      <ImageUploader
                        label="学生作品图片"
                        value={sc.workImage}
                        onChange={(base64) => updateStudentCase(ci, si, "workImage", base64)}
                      />
                    </div>
                  ))}
                  {course.studentCases.length === 0 && (
                    <p className="text-sm text-gray-400">暂无学生案例，点击上方按钮添加</p>
                  )}
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
          < ImageUploader
label = "关于我们配图"
value = { editedContent.about.image }
onChange = {(base64) => updateField("about.image", base64)}
            />
{
  editedContent.about.image && (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">图片预览</label>
      <ImageViewer
        src={editedContent.about.image}
        alt="关于我们配图预览"
        className="w-full max-w-md aspect-square object-cover rounded-lg border border-gray-200"
      />
    </div>
  )
}
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
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">地图展示</h4>
              <ImageUploader
                label="地图图片"
                value={editedContent.contact.mapImage}
                onChange={(base64) => updateField("contact.mapImage", base64)}
                previewFit="contain"
              />
              {editedContent.contact.mapImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地图预览</label>
                  <ImageViewer
                    src={editedContent.contact.mapImage}
                    alt="地图预览"
                    className="w-full max-w-md aspect-[4/3] object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}
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