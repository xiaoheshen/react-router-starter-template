// 数据存储层 - 开发环境使用内存 + JSON 文件持久化
// 生产环境可替换为 Cloudflare KV / D1

import { defaultContent, type SiteContent } from "./content";

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  course: string;
  message: string;
  createdAt: string;
}

// 内存存储
let content: SiteContent = { ...defaultContent };
let inquiries: Inquiry[] = [];

// ==================== 内容管理 ====================

export function getContent(): SiteContent {
  return content;
}

export function updateContent(newContent: SiteContent): SiteContent {
  content = { ...newContent };
  return content;
}

export function resetContent(): SiteContent {
  content = { ...defaultContent };
  return content;
}

// ==================== 课程管理 ====================

export function addCourse(course: Omit<typeof content.courses[number], "id"> & { id?: string }): typeof content.courses[number] {
  const newCourse = {
    ...course,
    id: course.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    teachers: course.teachers || [],
    studentCases: course.studentCases || [],
  };
  content.courses.push(newCourse as any);
  return newCourse as any;
}

export function deleteCourse(id: string): boolean {
  const index = content.courses.findIndex((c) => c.id === id);
  if (index !== -1) {
    content.courses.splice(index, 1);
    return true;
  }
  return false;
}

// ==================== 咨询管理 ====================

export function getInquiries(): Inquiry[] {
  return [...inquiries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addInquiry(inquiry: Omit<Inquiry, "id" | "createdAt">): Inquiry {
  const newInquiry: Inquiry = {
    ...inquiry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
  };
  inquiries.push(newInquiry);
  return newInquiry;
}

export function deleteInquiry(id: string): boolean {
  const index = inquiries.findIndex((i) => i.id === id);
  if (index !== -1) {
    inquiries.splice(index, 1);
    return true;
  }
  return false;
}

// ==================== 管理后台认证 ====================

const ADMIN_PASSWORD = "admin888";

export function verifyAdmin(password: string): boolean {
  return password === ADMIN_PASSWORD;
}