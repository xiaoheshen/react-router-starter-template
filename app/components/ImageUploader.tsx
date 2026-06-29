// 增强版图片上传组件
// 支持图片选择、客户端预览、格式/大小验证、自动压缩缩略图、上传进度显示
// 图片自动压缩后存储为 base64 data URL，大幅减小数据体积

import { useRef, useState, useCallback, useEffect } from "react";
import { validateImageFile, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_EXTENSIONS } from "../data/validation";

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

/**
 * 客户端图片压缩
 * 使用 Canvas API 在浏览器端缩放图片，大幅减小 base64 体积
 */
function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // 按比例缩放
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法创建画布"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // 优先使用 JPEG 格式（体积更小），PNG/GIF 保持原格式
        const outputType = file.type === "image/png" || file.type === "image/gif" ? file.type : "image/jpeg";
        resolve(canvas.toDataURL(outputType, quality));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
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

  // 同步外部 value 变化到预览
  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setUploadProgress("正在验证...");

      // 客户端验证
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.errors[0].message);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      setUploading(true);
      setUploadProgress("正在压缩图片...");

      try {
        // 对于小于 100KB 的图片直接读取，否则压缩
        const isSmallFile = file.size < 100 * 1024;

        let dataUrl: string;
        if (noCompress) {
          dataUrl = await readFileAsDataURL(file);
        } else if (isSmallFile) {
          dataUrl = await readFileAsDataURL(file);
        } else {
          // 压缩图片到合理尺寸
          dataUrl = await compressImage(file, maxWidth, maxHeight, 0.75);
        }

        setPreview(dataUrl);
        setUploadProgress("压缩完成");

        // 生成缩略图（如果需要）
        if (generateThumbnail) {
          try {
            const thumb = await compressImage(
              file,
              thumbnailWidth,
              thumbnailHeight,
              0.7
            );
            setThumbnail(thumb);
          } catch {
            console.warn("缩略图生成失败");
          }
        }

        // 将压缩后的 base64 传递给父组件
        onChange(dataUrl);

        // 计算压缩率
        if (!isSmallFile) {
          const originalSize = (file.size / 1024).toFixed(0);
          const compressedSize = ((dataUrl.length * 0.75) / 1024).toFixed(0); // base64 约 1.33x 原始大小
          setUploadProgress(`已压缩 (${originalSize}KB → ~${compressedSize}KB)`);
        } else {
          setUploadProgress("");
        }
      } catch (err) {
        setError("图片处理失败，请重试");
      } finally {
        setUploading(false);
      }
    },
    [onChange, generateThumbnail, maxWidth, maxHeight, thumbnailWidth, thumbnailHeight]
  );

  const handleRemove = useCallback(() => {
    setPreview("");
    setThumbnail("");
    setError(null);
    setUploadProgress("");
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  }, [onChange]);

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

      {uploadProgress && !uploading && (
        <p className="text-xs text-green-600">{uploadProgress}</p>
      )}

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
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
                // 图片加载失败时显示占位符
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
                {thumbnailWidth}x{thumbnailHeight}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}