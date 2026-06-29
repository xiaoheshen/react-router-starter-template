import type { Route } from "./+types/about";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getContent } from "../../data/store";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "关于我们 - 艺术培训工作室" },
    { name: "description", content: "了解我们的教学理念和师资团队" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  return getContent(context.cloudflare.env.DB);
}

export default function About({ loaderData }: Route.ComponentProps) {
  const { about, footer } = loaderData;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{about.title}</h1>
          <p className="text-lg text-gray-500">用心做教育，用爱育人才</p>
        </div>
      </section>

      {/* 简介 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gray-600 leading-relaxed text-lg">
                {about.description}
              </p>
            </div>
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {about.image ? (
                <img
                  src={about.image}
                  alt="关于我们"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-8xl">🏫</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 数据统计 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {about.stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-8 bg-white rounded-2xl shadow-sm"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 教学理念 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">我们的教学理念</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: "🎯", title: "以孩子为中心", desc: "尊重每个孩子的个性差异，因材施教，让每个孩子都能找到适合自己的学习方式" },
              { icon: "🌟", title: "激发创造力", desc: "不局限于技法传授，更注重培养孩子的想象力、创造力和审美能力" },
              { icon: "❤️", title: "快乐学习", desc: "寓教于乐的教学方式，让孩子在轻松愉快的氛围中感受艺术的魅力" },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer slogan={footer.slogan} copyright={footer.copyright} />
    </div>
  );
}