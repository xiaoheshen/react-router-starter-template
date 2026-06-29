// 增强版图片上传组件
// 支持图片选择、客户端预览、格式/大小验证、智能压缩、上传进度显示
// 图片自动压缩后存储为 base64 data URL，确保不超过 D1 数据库的 1MB 存储限制

import { useRef, useState, useCallback, useEffect } from "react";
import { validateImageFile, MAX_IMAGE_SIZE_MB, MAX_COMPRESSED_BASE64_SIZE, ALLOWED_IMAGE_EXTENSIONS } from "../data/validation";

// ==================== 压缩配置常量 ====================

/** D1 数据库单行存储限制约 1MB，base64 编码会使数据膨胀约 1.33 倍，因此设置安全阈值 */
const MAX_BASE64_LENGTH = MAX_COMPRESSED_BASE64_SIZE; // 从 validation 共用常量

/** 小型文件阈值：小于此值直接读取不压缩 */
const SMALL_FILE_THRESHOLD = 50 * 1024; // 50KB

/** 压缩质量梯度（从高到低依次尝试） */
const QUALITY_LEVELS = [0.8, 0.6, 0.4, 0.25];

/** 尺寸梯度（从大到小依次尝试） */
const DIMENSION_LEVELS = [
  { w: 1200, h: 1200 },
  { w: 900, h: 900 },
  { w: 600, h: 600 },
];

export interface CompressResult {
  dataUrl: string;
  width: number;
  height: number;
  binarySize: number;
  quality: number;
}

interface ImageUploaderProps {
  value: string;
  onChange: (base64: string) => void;
  label: string;
  maxWidth?: number;
  maxHeight?: number;
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  noCompress?: boolean;
  previewFit?: "cover" | "contain";
}

// ==================== 图片压缩引擎 ====================

/**
 * 估算 base64 data URL 对应的原始二进制大小
 * base64 编码膨胀率约为 4/3，减去 data URL 前缀
 */
function estimateBinarySize(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return dataUrl.length;
  const base64Part = dataUrl.substring(commaIndex + 1);
  return Math.round(base64Part.length * 0.75);
}

/**
 * 加载图片文件为 HTMLImageElement
 */
function loadImage(file: File): Promise<{ img: HTMLImageElement; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl });
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/**
 * 使用 Canvas 压缩图片到指定尺寸和质量
 * 返回压缩后的 data URL 和实际尺寸
 */
function compressWithCanvas(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  outputType: string
): CompressResult {
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // 按比例缩放
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // 确保最小尺寸
  width = Math.max(width, 1);
  height = Math.max(height, 1);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(outputType, quality);
  const binarySize = estimateBinarySize(dataUrl);

  return { dataUrl, width, height, binarySize, quality };
}

/**
 * 智能压缩图片到目标大小
 * 逐步降低质量和尺寸，确保压缩后 base64 不超过 MAX_BASE64_LENGTH
 *
 * 策略：
 * 1. 先尝试最高质量 + 最大尺寸
 * 2. 若超过阈值，逐步降低质量（0.8 → 0.6 → 0.4 → 0.25）
 * 3. 若仍超过阈值，缩小尺寸（1200 → 900 → 600）
 * 4. 极端情况下最终使用最低质量 + 最小尺寸
 */
async function compressImageToTarget(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<CompressResult> {
  const { img } = await loadImage(file);

  // 确定输出格式：优先 JPEG（体积更小），PNG/GIF 保持原格式
  const outputType =
    file.type === "image/png" || file.type === "image/gif" ? file.type : "image/jpeg";

  // 策略1：遍历尺寸和质量组合
  for (const dim of DIMENSION_LEVELS) {
    // 如果用户指定了更小的尺寸，使用用户指定的
    const targetW = Math.min(dim.w, maxWidth);
    const targetH = Math.min(dim.h, maxHeight);

    for (const q of QUALITY_LEVELS) {
      const result = compressWithCanvas(img, targetW, targetH, q, outputType);

      if (result.dataUrl.length <= MAX_BASE64_LENGTH) {
        return result;
      }
    }
  }

  // 策略2：最终兜底 - 使用最小尺寸 + 最低质量
  const finalResult = compressWithCanvas(
    img,
    Math.min(600, maxWidth),
    Math.min(600, maxHeight),
    0.2,
    outputType
  );

  // 如果兜底方案仍然超过限制，抛出明确的错误
  if (finalResult.dataUrl.length > MAX_BASE64_LENGTH) {
    throw new Error(
      `图片压缩后仍过大（${(finalResult.binarySize / 1024).toFixed(0)}KB），请使用更小的图片`
    );
  }

  return finalResult;
}

/**
 * 读取文件为 base64 data URL（不压缩，用于小文件）
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

// ==================== 组件 ====================

export function ImageUploader({
  value,
  onChange,
  label,
  maxWidth = 1200,
  maxHeight = 1200,
  generateThumbnail = false,
  thumbnailWidth = 200,
  thumbnailHeight = 200,
  noCompress = false,
  previewFit = "cover",
}: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);
  const [thumbnail, setThumbnail] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [compressInfo, setCompressInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    dimensions: string;
    quality: number;
  } | null>(null);

  // 同步外部 value 变化到预览
  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setCompressInfo(null);
      setUploadProgress("正在验证...");

      // 客户端验证
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.errors[0].message);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      setUploading(true);
      setUploadProgress("正在处理图片...");

      try {
        let dataUrl: string;
        let compressResult: CompressResult | null = null;

        if (noCompress) {
          // 不压缩模式：直接读取原始文件
          dataUrl = await readFileAsDataURL(file);
          setUploadProgress("已读取原始文件");

          // 检查不压缩的文件是否超过 D1 限制
          if (dataUrl.length > MAX_BASE64_LENGTH) {
            setError(
              `图片过大（${(estimateBinarySize(dataUrl) / 1024).toFixed(0)}KB），请启用压缩或使用更小的图片`
            );
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
            return;
          }
        } else if (file.size <= SMALL_FILE_THRESHOLD) {
          // 小文件直接读取，但也检查 base64 大小
          dataUrl = await readFileAsDataURL(file);
          setUploadProgress("");

          // 小文件也可能超限（如高压缩比的 JPEG 可能 base64 很大）
          if (dataUrl.length > MAX_BASE64_LENGTH) {
            setUploadProgress("小文件超限，正在压缩...");
            compressResult = await compressImageToTarget(file, maxWidth, maxHeight);
            dataUrl = compressResult.dataUrl;
          }
        } else {
          // 智能压缩到目标大小
          setUploadProgress("正在智能压缩...");
          compressResult = await compressImageToTarget(file, maxWidth, maxHeight);
          dataUrl = compressResult.dataUrl;
        }

        setPreview(dataUrl);

        // 生成缩略图（如果需要）
        if (generateThumbnail) {
          try {
            const { img } = await loadImage(file);
            const thumbResult = compressWithCanvas(
              img,
              thumbnailWidth,
              thumbnailHeight,
              0.7,
              "image/jpeg"
            );
            setThumbnail(thumbResult.dataUrl);
          } catch {
            console.warn("缩略图生成失败");
          }
        }

        // 将压缩后的 base64 传递给父组件
        onChange(dataUrl);

        // 显示压缩统计信息
        const originalSize = file.size;
        const compressedBinarySize = compressResult
          ? compressResult.binarySize
          : estimateBinarySize(dataUrl);

        if (originalSize > SMALL_FILE_THRESHOLD || compressResult) {
          const ratio = ((1 - compressedBinarySize / originalSize) * 100).toFixed(0);
          const dims = compressResult
            ? `${compressResult.width}×${compressResult.height}`
            : "原始尺寸";

          setCompressInfo({
            originalSize,
            compressedSize: compressedBinarySize,
            dimensions: dims,
            quality: compressResult ? compressResult.quality : 1,
          });

          setUploadProgress(
            `已压缩: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedBinarySize / 1024).toFixed(0)}KB (节省${ratio}%)`
          );
        } else {
          setUploadProgress("");
        }
      } catch (err: any) {
        const message = err?.message || "图片处理失败，请重试";
        setError(message);
        console.error("图片压缩失败:", err);
      } finally {
        setUploading(false);
      }
    },
    [onChange, generateThumbnail, maxWidth, maxHeight, thumbnailWidth, thumbnailHeight, noCompress]
  );

  const handleRemove = useCallback(() => {
    setPreview("");
    setThumbnail("");
    setError(null);
    setUploadProgress("");
    setCompressInfo(null);
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  }, [onChange]);

  // 判断压缩程度颜色
  const getCompressColor = (binarySize: number): string => {
    if (binarySize < 200 * 1024) return "text-green-600";
    if (binarySize < 500 * 1024) return "text-amber-600";
    return "text-orange-600";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED_IMAGE_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              处理中...
            </span>
          ) : (
            "选择图片"
          )}
        </button>

        <span className="text-xs text-gray-400">
          支持 {ALLOWED_IMAGE_EXTENSIONS.join(", ")}，最大 {MAX_IMAGE_SIZE_MB}MB{noCompress ? "" : "，自动压缩"}
        </span>
      </div>

      {/* 压缩进度/结果 */}
      {uploadProgress && !uploading && (
        <div className="space-y-1">
          <p className={`text-xs ${compressInfo ? getCompressColor(compressInfo.compressedSize) : "text-green-600"}`}>
            {uploadProgress}
          </p>
          {compressInfo && (
            <p className="text-xs text-gray-400">
              尺寸: {compressInfo.dimensions} · 质量: {Math.round(compressInfo.quality * 100)}% · 
              存储: {(compressInfo.compressedSize / 1024).toFixed(0)}KB
              {compressInfo.compressedSize > 700 * 1024 && (
                <span className="text-amber-500 ml-1">⚠ 接近存储上限</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-red-400 mt-1">
              建议：使用更小的图片，或确保图片宽度不超过 1200px
            </p>
          </div>
        </div>
      )}

      {/* 预览区域 */}
      {(preview || value) && (
        <div className="flex items-start gap-4 flex-wrap">
          {/* 原图/压缩后预览 */}
          <div className="relative group">
            <img
              src={preview || value}
              alt="预览"
              className={`h-24 w-24 rounded-lg border border-gray-200 ${previewFit === "contain" ? "object-contain" : "object-cover"}`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent && !parent.querySelector(".image-error-placeholder")) {
                  const placeholder = document.createElement("div");
                  placeholder.className = "image-error-placeholder h-24 w-24 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center";
                  placeholder.innerHTML = '<span class="text-xs text-gray-400">加载失败</span>';
                  parent.appendChild(placeholder);
                }
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
              title="删除图片"
            >
              ×
            </button>
            <span className="text-xs text-gray-400 mt-1 block text-center">预览</span>
          </div>

          {/* 缩略图预览 */}
          {thumbnail && (
            <div className="relative group">
              <img
                src={thumbnail}
                alt="缩略图"
                className="h-24 w-24 object-cover rounded-lg border border-gray-200"
              />
              <span className="text-xs text-gray-400 mt-1 block text-center">
                {thumbnailWidth}×{thumbnailHeight}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}