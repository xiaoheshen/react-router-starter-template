// 增强版图片上传组件
// 支持图片选择、客户端预览、格式/大小验证、客户端缩略图生成、上传进度显示

import { useRef, useState, useCallback } from "react";
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
}

/**
 * 客户端图片压缩 - 生成缩略图
 * 使用 Canvas API 在浏览器端缩放图片
 */
function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
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
        resolve(canvas.toDataURL(file.type, quality));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/**
 * 读取文件为 base64 data URL（不压缩）
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
  generateThumbnail = false,
  thumbnailWidth = 200,
  thumbnailHeight = 200,
}: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);
  const [thumbnail, setThumbnail] = useState<string>("");

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      // 客户端验证
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.errors[0].message);
        // 重置 input 以便重新选择同一文件
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      setUploading(true);

      try {
        // 读取原图用于预览
        const dataUrl = await readFileAsDataURL(file);
        setPreview(dataUrl);

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
            // 缩略图生成失败不阻塞主流程
            console.warn("缩略图生成失败");
          }
        }

        // 将原图 base64 传递给父组件
        onChange(dataUrl);
      } catch (err) {
        setError("图片读取失败，请重试");
      } finally {
        setUploading(false);
      }
    },
    [onChange, generateThumbnail, thumbnailWidth, thumbnailHeight]
  );

  const handleRemove = useCallback(() => {
    setPreview("");
    setThumbnail("");
    setError(null);
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  }, [onChange]);

  // 同步外部 value 变化
  if (value !== preview && !value && preview) {
    // 外部清空时同步
  }

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
          支持 {ALLOWED_IMAGE_EXTENSIONS.join(", ")}，最大 {MAX_IMAGE_SIZE_MB}MB
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* 预览区域 */}
      {(preview || value) && (
        <div className="flex items-start gap-4 flex-wrap">
          {/* 原图预览 */}
          <div className="relative group">
            <img
              src={preview || value}
              alt="预览"
              className="h-24 w-24 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              title="删除图片"
            >
              ×
            </button>
            <span className="text-xs text-gray-400 mt-1 block text-center">原图</span>
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