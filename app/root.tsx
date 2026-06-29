import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigation,
} from "react-router";
import type { Route } from "./+types/root";
import { useEffect, useState } from "react";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap",
	},
];

/**
 * 导航加载进度条
 * 在页面跳转时显示顶部加载动画，300ms 内完成视觉反馈
 */
function NavigationLoadingBar() {
	const navigation = useNavigation();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (navigation.state === "loading") {
			// 仅在超过 50ms 的加载时显示进度条，避免闪烁
			const timer = setTimeout(() => setVisible(true), 50);
			return () => clearTimeout(timer);
		} else {
			setVisible(false);
		}
	}, [navigation.state]);

	if (!visible) return null;

	return <div className="navigation-loading-bar" />;
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				{/* 预加载关键资源 */}
				<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
				<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
				{/* 预取可能访问的下一页 */}
				<link rel="prefetch" href="/courses" as="document" />
				<link rel="prefetch" href="/about" as="document" />
				<link rel="prefetch" href="/contact" as="document" />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<>
			<NavigationLoadingBar />
			<Outlet />
		</>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "哎呀！";
	let details = "发生了一些意外错误。";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "错误";
		details =
			error.status === 404
				? "您访问的页面不存在。"
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center p-8">
				<h1 className="text-6xl font-bold text-gray-200 mb-4">{message}</h1>
				<p className="text-gray-500 text-lg mb-8">{details}</p>
				<a href="/" className="text-blue-600 hover:text-blue-700 underline">
					返回首页
				</a>
				{stack && (
					<pre className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-sm overflow-x-auto max-w-lg mx-auto">
						<code>{stack}</code>
					</pre>
				)}
			</div>
		</main>
	);
}