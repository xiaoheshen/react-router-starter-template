import { useEffect, useState, useCallback } from "react";

export interface ToastProps {
  /** 提示类型 */
  type: "success" | "error";
  /** 提示标题 */
  title: string;
  /** 提示消息（可选） */
  message?: string;
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 重试回调（仅 error 类型有效） */
  onRetry?: () => void;
  /** 自动关闭延迟（毫秒），仅 success 类型生效，默认 4000 */
  autoCloseDelay?: number;
}

export default function Toast({
  type,
  title,
  message,
  visible,
  onClose,
  onRetry,
  autoCloseDelay = 4000,
}: ToastProps) {
  const [animating, setAnimating] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      // 触发进入动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      // 等待退出动画完成后移除 DOM
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 自动关闭
  useEffect(() => {
    if (!visible || type !== "success") return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);
    return () => clearTimeout(timer);
  }, [visible, type, autoCloseDelay, onClose]);

  // ESC 关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [visible, handleKeyDown]);

  if (!show) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out
        ${animating ? "bg-black/40 backdrop-blur-sm" : "bg-transparent"}`}
      onClick={(e) => {
        // 点击遮罩关闭
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl p-8 transition-all duration-300 ease-out
          ${animating ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4"}
          ${isSuccess ? "bg-white" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部色条 */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${
            isSuccess
              ? "bg-gradient-to-r from-emerald-400 to-green-500"
              : "bg-gradient-to-r from-red-400 to-rose-500"
          }`}
        />

        {/* 图标 */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-[toast-bounce-in_0.5s_ease-out]">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-[toast-bounce-in_0.5s_ease-out]">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h3
          className={`text-xl font-bold text-center mb-2 ${
            isSuccess ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {title}
        </h3>

        {/* 消息 */}
        {message && (
          <p className="text-gray-500 text-center text-sm mb-6">{message}</p>
        )}

        {/* 按钮 */}
        <div className="flex justify-center gap-3">
          {isSuccess ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
            >
              我知道了
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                关闭
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                >
                  重试
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 注入动画关键帧 */}
      <style>{`
        @keyframes toast-bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}