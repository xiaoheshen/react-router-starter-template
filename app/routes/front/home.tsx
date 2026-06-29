import type { Route } from "./+types/home";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { Hero } from "../../components/Hero";
import { CourseCard } from "../../components/CourseCard";
import { getContent } from "../../data/store";
import { Link } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "艺术培训工作室 - 发现孩子的艺术天赋" },
    { name: "description", content: "专注初中小学美术、吉他兴趣、趣味书法、舞蹈培训" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  return getContent(context.cloudflare.env.DB);
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { hero, courses, about, footer } = loaderData;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <Hero
        title={hero.title}
        subtitle={hero.subtitle}
        ctaText={hero.ctaText}
        backgroundImage={hero.backgroundImage}
        titleColor={hero.titleColor}
        subtitleColor={hero.subtitleColor}
        ctaBgColor={hero.ctaBgColor}
        ctaTextColor={hero.ctaTextColor}
      />

      {/* 课程概览 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              精选课程
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              四大课程体系，覆盖美术、音乐、书法、舞蹈，满足不同孩子的兴趣需求
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              查看全部课程
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 关于我们 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {about.title}
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                {about.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {about.stats.map((stat) => (
                  <div key={stat.label} className="text-center p-4 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 mt-8 text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                了解更多
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              {about.image ? (
                <img
                  src={about.image}
                  alt="关于我们"
                  className="aspect-[4/3] object-cover rounded-2xl w-full"
                />
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <span className="text-6xl">🎓</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            准备好开始艺术之旅了吗？
          </h2>
          <p className="text-blue-100 mb-8">
            预约免费试听课，让孩子亲身体验艺术的魅力
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            立即预约
          </Link>
        </div>
      </section>

      <Footer slogan={footer.slogan} copyright={footer.copyright} />
    </div>
  );
}