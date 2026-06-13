import { Link } from "react-router";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
}

export function Hero({ title, subtitle, ctaText }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      {/* 内容 */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6 animate-fade-in-up">
          {title}
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-fade-in-up-delay-1">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-2">
          <Link
            to="/contact"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            {ctaText}
          </Link>
          <Link
            to="/courses"
            className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
          >
            了解课程
          </Link>
        </div>

        {/* 课程标签 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-16 animate-fade-in-up-delay-3">
          {["美术", "吉他", "书法", "舞蹈"].map((tag, i) => (
            <span
              key={tag}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 border border-gray-100 shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}