import type { Route } from "./+types/courses";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getContent } from "../../data/store";
import { Link } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "课程介绍 - 艺术培训工作室" },
    { name: "description", content: "初中小学美术、吉他兴趣、趣味书法、舞蹈培训课程详情" },
  ];
}

export function loader({ }: Route.LoaderArgs) {
  return getContent();
}

export default function Courses({ loaderData }: Route.ComponentProps) {
  const { courses, footer } = loaderData;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">课程介绍</h1>
          <p className="text-lg text-gray-500">四大课程体系，全面培养孩子的艺术素养</p>
        </div>
      </section>

      {/* 课程详情 */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {courses.map((course, i) => (
            <div
              key={course.id}
              id={course.id}
              className="scroll-mt-24"
            >
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${i % 2 === 1 ? "lg:grid-flow-dense" : ""
                }`}>
                <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${course.color} mb-4`}>
                    {course.subtitle}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {course.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-6">
                    {course.description}
                  </p>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">课程内容：</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {course.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className={`w-4 h-4 flex-shrink-0 text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className={`inline-flex mt-8 px-6 py-3 bg-gradient-to-r ${course.color} text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300`}
                  >
                    预约试听
                  </Link>
                </div>
                <div className={i % 2 === 1 ? "lg:col-start-1" : ""}>
                  {course.image ? (
                    <div
                      className="aspect-square rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${course.image})` }}
                    />
                  ) : (
                    <div className={`aspect-square rounded-2xl bg-gradient-to-br ${course.color.replace("500", "100")} flex items-center justify-center`}>
                      <span className="text-8xl">
                        {course.id === "art" && "🎨"}
                        {course.id === "guitar" && "🎸"}
                        {course.id === "calligraphy" && "✒️"}
                        {course.id === "dance" && "💃"}
                        {!["art", "guitar", "calligraphy", "dance"].includes(course.id) && "📚"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 教师信息 */}
              {course.teachers.length > 0 && (
                <div className="mt-16">
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">师资力量</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.teachers.map((teacher, ti) => (
                      <div key={ti} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        {teacher.image ? (
                          <div
                            className="h-48 bg-cover bg-center"
                            style={{ backgroundImage: `url(${teacher.image})` }}
                          />
                        ) : (
                          <div className={`h-48 bg-gradient-to-br ${course.color.replace("500", "100")} flex items-center justify-center`}>
                            <span className="text-4xl">👨‍🏫</span>
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                          {teacher.description && (
                            <p className="text-sm text-gray-500 mt-1">{teacher.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 学生案例 */}
              {course.studentCases.length > 0 && (
                <div className="mt-16">
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">优秀学生案例</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.studentCases.map((sc, si) => (
                      <div key={si} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        {sc.workImage ? (
                          <div
                            className="h-48 bg-cover bg-center"
                            style={{ backgroundImage: `url(${sc.workImage})` }}
                          />
                        ) : (
                          <div className={`h-48 bg-gradient-to-br ${course.color.replace("500", "100")} flex items-center justify-center`}>
                            <span className="text-4xl">🏆</span>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{sc.name}</h4>
                            {sc.time && (
                              <span className="text-xs text-gray-400">{sc.time}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer slogan={footer.slogan} copyright={footer.copyright} />
    </div>
  );
}