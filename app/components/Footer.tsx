import { Link } from "react-router";

interface FooterProps {
  slogan?: string;
  copyright?: string;
}

export function Footer({ slogan, copyright }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">艺</span>
              </div>
              <span className="font-bold text-lg text-white">艺术培训</span>
            </Link>
            {slogan && <p className="text-sm">{slogan}</p>}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">快速导航</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="hover:text-white transition-colors">课程介绍</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">关于我们</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">联系我们</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium mb-4">联系方式</h3>
            <ul className="space-y-2 text-sm">
              <li>电话：138-0000-0000</li>
              <li>邮箱：hello@example.com</li>
              <li>微信：artstudio666</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>{copyright || "© 2026 艺术培训工作室. All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}