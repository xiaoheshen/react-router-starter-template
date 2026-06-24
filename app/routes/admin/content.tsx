import type { Route } from "./+types/content";
import { getContent, updateContent, resetContent, deleteCourse } from "../../data/store";
import type { SiteContent, Teacher, StudentCase } from "../../data/content";
import { useState, useRef } from "react";
import { Form, useNavigation } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "内容管理 - 管理后台" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  return getContent(context.cloudflare.env.DB);
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
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

  if (intent === "save") {
    const contentJson = formData.get("content") as string;
    try {
      const content = JSON.parse(contentJson) as SiteContent;
      await updateContent(db, content);
      return { success: true, message: "保存成功" };
    } catch {
      return { error: "数据格式错误" };
    }
  }

  return { error: "未知操作" };
}

// 图片上传组件 - 转为 base64
function ImageUpload({ value, onChange, label }: { value: string; onChange: (base64: string) => void; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          选择图片
        </button>
        {value && (
          <div className="relative group">
            <img src={value} alt="预览" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
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

  const updateField = (path: string, value: any) => {
    const keys = path.split(".");
    const newContent = structuredClone(editedContent);
    let current: any = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditedContent(newContent);
  };

  const updateCourse = (index: number, field: string, value: any) => {
    const newContent = structuredClone(editedContent);
    (newContent.courses[index] as any)[field] = value;
    setEditedContent(newContent);
  };

  const updateCourseFeature = (courseIndex: number, featureIndex: number, value: string) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].features[featureIndex] = value;
    setEditedContent(newContent);
  };

  const addCourseFeature = (courseIndex: number) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].features.push("");
    setEditedContent(newContent);
  };

  const removeCourseFeature = (courseIndex: number, featureIndex: number) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].features.splice(featureIndex, 1);
    setEditedContent(newContent);
  };

  // 教师管理
  const addTeacher = (courseIndex: number) => {
    const course = editedContent.courses[courseIndex];
    if (course.teachers.length >= 3) return;
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].teachers.push({ name: "", description: "", image: "" });
    setEditedContent(newContent);
  };

  const removeTeacher = (courseIndex: number, teacherIndex: number) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].teachers.splice(teacherIndex, 1);
    setEditedContent(newContent);
  };

  const updateTeacher = (courseIndex: number, teacherIndex: number, field: keyof Teacher, value: string) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].teachers[teacherIndex][field] = value;
    setEditedContent(newContent);
  };

  // 学生案例管理
  const addStudentCase = (courseIndex: number) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].studentCases.push({ name: "", time: "", workImage: "" });
    setEditedContent(newContent);
  };

  const removeStudentCase = (courseIndex: number, caseIndex: number) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].studentCases.splice(caseIndex, 1);
    setEditedContent(newContent);
  };

  const updateStudentCase = (courseIndex: number, caseIndex: number, field: keyof StudentCase, value: string) => {
    const newContent = structuredClone(editedContent);
    newContent.courses[courseIndex].studentCases[caseIndex][field] = value;
    setEditedContent(newContent);
  };

  // 添加新课程
  const handleAddCourse = () => {
    const newContent = structuredClone(editedContent);
    newContent.courses.push({
      id: Date.now().toString(36),
      title: "",
      subtitle: "",
      description: "",
      features: [""],
      image: "",
      color: "from-blue-500 to-cyan-500",
      teachers: [],
      studentCases: [],
    });
    setEditedContent(newContent);
  };

  // 删除课程
  const handleDeleteCourse = (index: number) => {
    const newContent = structuredClone(editedContent);
    newContent.courses.splice(index, 1);
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
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${actionData?.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
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
            <ImageUpload
              label="首页横幅背景图片"
              value={editedContent.hero.backgroundImage}
              onChange={(base64) => updateField("hero.backgroundImage", base64)}
            />
            {editedContent.hero.backgroundImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">背景预览</label>
                <div
                  className="w-full h-40 rounded-lg bg-cover bg-center border border-gray-200"
                  style={{ backgroundImage: `url(${editedContent.hero.backgroundImage})` }}
                />
              </div>
            )}
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
                <ImageUpload
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
                      <ImageUpload
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
                      <ImageUpload
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