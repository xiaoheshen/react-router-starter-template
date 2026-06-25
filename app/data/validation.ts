// 数据验证工具模块
// 提供统一的表单验证、数据清洗和错误处理机制

import type { SiteContent, Course, Teacher, StudentCase } from "./content";

// ==================== 通用验证工具 ====================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 必填字段验证
 */
export function required(value: string | undefined | null, fieldName: string): ValidationError | null {
  if (!value || value.trim().length === 0) {
    return { field: fieldName, message: `${fieldName}不能为空` };
  }
  return null;
}

/**
 * 字符串长度验证
 */
export function maxLength(value: string, max: number, fieldName: string): ValidationError | null {
  if (value.length > max) {
    return { field: fieldName, message: `${fieldName}不能超过${max}个字符` };
  }
  return null;
}

/**
 * minLength 验证
 */
export function minLength(value: string, min: number, fieldName: string): ValidationError | null {
  if (value.trim().length < min) {
    return { field: fieldName, message: `${fieldName}至少需要${min}个字符` };
  }
  return null;
}

/**
 * 手机号格式验证
 */
export function phone(value: string): ValidationError | null {
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(value.replace(/\s|-/g, ""))) {
    return { field: "phone", message: "请输入正确的手机号码" };
  }
  return null;
}

/**
 * 邮箱格式验证
 */
export function email(value: string): ValidationError | null {
  if (!value) return null; // 可选字段
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { field: "email", message: "请输入正确的邮箱地址" };
  }
  return null;
}

/**
 * 收集所有验证错误
 */
export function validate(...checks: (ValidationError | null)[]): ValidationResult {
  const errors = checks.filter((c): c is ValidationError => c !== null);
  return { valid: errors.length === 0, errors };
}

// ==================== 站点内容验证 ====================

export function validateSiteContent(content: SiteContent): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Hero 验证
  const heroErr = required(content.hero.title, "首页标题");
  if (heroErr) errors.push(heroErr);
  const heroSubErr = required(content.hero.subtitle, "首页副标题");
  if (heroSubErr) errors.push(heroSubErr);
  const ctaErr = required(content.hero.ctaText, "按钮文字");
  if (ctaErr) errors.push(ctaErr);
  
  // 课程验证
  if (content.courses.length === 0) {
    errors.push({ field: "courses", message: "至少需要添加一个课程" });
  }
  content.courses.forEach((course, i) => {
    const coursePrefix = `课程${i + 1}`;
    const titleErr = required(course.title, `${coursePrefix}名称`);
    if (titleErr) errors.push(titleErr);
    const descErr = required(course.description, `${coursePrefix}描述`);
    if (descErr) errors.push(descErr);
    if (course.features.length === 0) {
      errors.push({ field: `courses[${i}].features`, message: `${coursePrefix}至少需要一个特色描述` });
    }
    course.features.forEach((f, j) => {
      const featErr = required(f, `${coursePrefix}特色${j + 1}`);
      if (featErr) errors.push(featErr);
    });
    course.teachers.forEach((t, j) => {
      if (t.name) {
        const nameErr = maxLength(t.name, 50, `${coursePrefix}教师${j + 1}姓名`);
        if (nameErr) errors.push(nameErr);
      }
    });
  });
  
  // About 验证
  const aboutTitleErr = required(content.about.title, "关于我们标题");
  if (aboutTitleErr) errors.push(aboutTitleErr);
  const aboutDescErr = required(content.about.description, "关于我们描述");
  if (aboutDescErr) errors.push(aboutDescErr);
  
  // Contact 验证
  const phoneErr = required(content.contact.phone, "联系电话");
  if (phoneErr) errors.push(phoneErr);
  
  return { valid: errors.length === 0, errors };
}

// ==================== 咨询表单验证 ====================

export function validateInquiry(data: {
  name: string;
  phone: string;
  email?: string;
  course?: string;
  message?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  const nameErr = required(data.name, "姓名");
  if (nameErr) errors.push(nameErr);
  else {
    const nameLenErr = maxLength(data.name, 50, "姓名");
    if (nameLenErr) errors.push(nameLenErr);
  }
  
  const phoneErr = required(data.phone, "电话");
  if (phoneErr) errors.push(phoneErr);
  else {
    const phoneFmtErr = phone(data.phone);
    if (phoneFmtErr) errors.push(phoneFmtErr);
  }
  
  if (data.email) {
    const emailErr = email(data.email);
    if (emailErr) errors.push(emailErr);
  }
  
  if (data.message) {
    const msgLenErr = maxLength(data.message, 500, "留言");
    if (msgLenErr) errors.push(msgLenErr);
  }
  
  return { valid: errors.length === 0, errors };
}

// ==================== 图片验证 ====================

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE_MB = 5;

export function validateImageFile(file: File): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push({ 
      field: "image", 
      message: `不支持的图片格式，仅支持 ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}` 
    });
  }
  
  if (file.size > MAX_IMAGE_SIZE) {
    errors.push({ 
      field: "image", 
      message: `图片大小不能超过 ${MAX_IMAGE_SIZE_MB}MB` 
    });
  }
  
  if (file.size === 0) {
    errors.push({ field: "image", message: "图片文件为空" });
  }
  
  return { valid: errors.length === 0, errors };
}

// ==================== 数据清洗 ====================

/**
 * XSS 防护 - 转义 HTML 特殊字符
 */
export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * 清理输入字符串：去除首尾空格，限制长度
 */
export function sanitizeInput(value: string, maxLen: number = 500): string {
  return value.trim().slice(0, maxLen);
}