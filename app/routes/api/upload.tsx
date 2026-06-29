// 图片上传 API 端点
// 接收 multipart/form-data 上传，验证文件格式和大小，返回 base64 数据 URL
// Cloudflare Workers 环境下使用 base64 存储（替代文件系统存储）
// D1 数据库单行限制约 1MB，base64 编码膨胀约 1.33x，因此设置安全阈值

import type { Route } from "./+types/upload";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB 原始文件上传限制
const MAX_BASE64_SIZE = 900 * 1024; // 900KB base64 字符串，确保不超过 D1 1MB 限制

export async function action({ request }: Route.ActionArgs) {
  // 验证请求方法
  if (request.method !== "POST") {
    return Response.json(
      { error: "仅支持 POST 请求" },
      { status: 405 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        { error: "请使用 multipart/form-data 格式上传" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return Response.json(
        { error: "未选择图片文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `不支持的图片格式，仅支持 JPG、PNG、GIF、WebP` },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `图片大小不能超过 5MB，当前文件大小 ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // 将文件读取为 ArrayBuffer，然后转为 base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 分块转换为 base64（避免大文件导致栈溢出）
    const CHUNK_SIZE = 0x8000; // 32KB chunks
    let base64 = "";
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      const chunk = uint8Array.subarray(i, i + CHUNK_SIZE);
      base64 += String.fromCharCode.apply(null, Array.from(chunk));
    }
    base64 = btoa(base64);

    const dataUrl = `data:${file.type};base64,${base64}`;

    // 验证 base64 数据大小，确保不超过 D1 数据库存储限制
    if (dataUrl.length > MAX_BASE64_SIZE) {
      return Response.json(
        {
          error: `图片数据过大（${(dataUrl.length / 1024).toFixed(0)}KB），请压缩后再上传。建议使用前端图片压缩功能。`,
        },
        { status: 413 }
      );
    }

    return Response.json({
      success: true,
      data: {
        url: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (err: any) {
    console.error("图片上传失败:", err);
    return Response.json(
      { error: "图片上传处理失败，请重试" },
      { status: 500 }
    );
  }
}