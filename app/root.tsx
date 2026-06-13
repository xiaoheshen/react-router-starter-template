import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
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

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
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
	return <Outlet />;
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