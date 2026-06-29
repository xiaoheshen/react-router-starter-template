import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  /** 图片加载优先级，默认 lazy */
  loading?: "lazy" | "eager";
}

/**
 * 可点击放大的图片组件
 * 点击图片后弹出全屏查看器，支持缩放和拖拽
 */
export function ImageViewer({ src, alt = "", className = "", loading = "lazy" }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 缩放控制
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 0.5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 5));
    } else {
      setScale((prev) => {
        const newScale = Math.max(prev - 0.25, 0.5);
        if (newScale <= 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    }
  }, []);

  // 拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 键盘事件
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          setScale(1);
          setPosition({ x: 0, y: 0 });
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, zoomIn, zoomOut]);

  // 点击背景关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      close();
    }
  }, [close]);

  return (
    <>
      {/* 缩略图 */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`${className} cursor-zoom-in`}
        onClick={open}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />

      {/* 全屏查看器（Portal 到 body） */}
      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center animate-fade-in"
            onClick={handleBackdropClick}
          >
            {/* 顶部工具栏 */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={zoomOut}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="缩小 (-)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
                  title="重置 (0)"
                >
                  1:1
                </button>
                <button
                  onClick={zoomIn}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="放大 (+)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                  onClick={close}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="关闭 (Esc)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 图片容器 */}
            <div
              className="max-w-[95vw] max-h-[95vh] flex items-center justify-center select-none"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
            >
              <img
                ref={imageRef}
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                }}
                draggable={false}
              />
            </div>

            {/* 底部提示 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none">
              滚轮缩放 · 拖拽移动 · Esc 关闭
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * 为背景图 div 添加点击查看原图功能
 * 包裹一个 div（使用 background-image），点击后弹出全屏查看器
 */
interface BgImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function BgImageViewer({ src, alt = "", className = "", style, children }: BgImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 0.5);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 5));
    } else {
      setScale((prev) => {
        const newScale = Math.max(prev - 0.25, 0.5);
        if (newScale <= 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") { setScale(1); setPosition({ x: 0, y: 0 }); }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, zoomIn, zoomOut]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) close();
  }, [close]);

  return (
    <>
      <div
        className={`${className} cursor-zoom-in`}
        style={style}
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        title="点击查看原图"
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center animate-fade-in"
            onClick={handleBackdropClick}
          >
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-white/80 text-sm">{Math.round(scale * 100)}%</span>
              <div className="flex items-center gap-1">
                <button onClick={zoomOut} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors" title="缩小">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium" title="重置">
                  1:1
                </button>
                <button onClick={zoomIn} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors" title="放大">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button onClick={close} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors" title="关闭">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              className="max-w-[95vw] max-h-[95vh] flex items-center justify-center select-none"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
            >
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
                draggable={false}
              />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none">
              滚轮缩放 · 拖拽移动 · Esc 关闭
            </div>
          </div>,
          document.body
        )}
    </>
  );
}