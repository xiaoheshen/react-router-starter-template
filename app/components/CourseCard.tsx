import { Link } from "react-router";
import type { Course } from "../data/content";
import { BgImageViewer } from "./ImageViewer";

interface CourseCardProps {
  course: Course;
  index: number;
}

export function CourseCard({ course, index }: CourseCardProps) {
  return (
    <Link
      to={`/courses#${course.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* 顶部色块或图片 */}
      {course.image ? (
        <BgImageViewer
          src={course.image}
          alt={course.title}
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${course.image})` }}
        />
      ) : (
        <div className={`h-2 bg-gradient-to-r ${course.color}`} />
      )}

      <div className="p-6">
        {/* 图标 */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center mb-4`}>
          <span className="text-white text-xl font-bold">
            {course.id === "art" && "🎨"}
            {course.id === "guitar" && "🎸"}
            {course.id === "calligraphy" && "✒️"}
            {course.id === "dance" && "💃"}
            {!["art", "guitar", "calligraphy", "dance"].includes(course.id) && "📚"}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{course.subtitle}</p>
        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
          {course.description}
        </p>

        {/* 特性标签 */}
        <div className="flex flex-wrap gap-2">
          {course.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-md"
            >
              {f}
            </span>
          ))}
          {course.features.length > 3 && (
            <span className="px-2.5 py-1 text-gray-400 text-xs">
              +{course.features.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}