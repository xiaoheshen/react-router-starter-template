// 数据存储层 - 使用 Cloudflare D1 数据库
import { defaultContent, type SiteContent, type Course, type Teacher, type StudentCase } from "./content";
import type { D1Database } from "@cloudflare/workers-types";
import bcrypt from "bcryptjs";

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  course: string;
  message: string;
  status: string;
  createdAt: string;
}

// ==================== 内容管理 ====================

export async function getContent(db: D1Database): Promise<SiteContent> {
  const sections = await db.prepare("SELECT * FROM site_content").all();

  // 首次访问时初始化默认数据
  if (sections.results.length === 0) {
    await seedDefaultContent(db);
    return { ...defaultContent };
  }

  const heroSection = sections.results.find((r: any) => r.section === "hero");
  const aboutSection = sections.results.find((r: any) => r.section === "about");
  const contactSection = sections.results.find((r: any) => r.section === "contact");
  const footerSection = sections.results.find((r: any) => r.section === "footer");

  const courses = await getCourses(db);

  const heroData = heroSection ? JSON.parse(heroSection.data || "{}") : {};
  const aboutData = aboutSection ? JSON.parse(aboutSection.data || "{}") : {};
  const contactData = contactSection ? JSON.parse(contactSection.data || "{}") : {};
  const footerData = footerSection ? JSON.parse(footerSection.data || "{}") : {};

  return {
    hero: {
      title: heroSection?.title || defaultContent.hero.title,
      subtitle: heroSection?.subtitle || defaultContent.hero.subtitle,
      ctaText: heroSection?.description || defaultContent.hero.ctaText,
      backgroundImage: heroData.backgroundImage || "",
    },
    courses: courses.length > 0 ? courses : defaultContent.courses,
    about: {
      title: aboutSection?.title || defaultContent.about.title,
      description: aboutSection?.description || defaultContent.about.description,
      stats: aboutData.stats || defaultContent.about.stats,
      image: aboutData.image || "",
    },
    contact: {
      title: contactSection?.title || defaultContent.contact.title,
      description: contactSection?.description || defaultContent.contact.description,
      phone: contactData.phone || defaultContent.contact.phone,
      email: contactData.email || defaultContent.contact.email,
      address: contactData.address || defaultContent.contact.address,
      wechat: contactData.wechat || defaultContent.contact.wechat,
    },
    footer: {
      slogan: footerSection?.title || defaultContent.footer.slogan,
      copyright: footerSection?.subtitle || defaultContent.footer.copyright,
    },
  };
}

async function getCourses(db: D1Database): Promise<Course[]> {
  const courseRows = await db.prepare(
    "SELECT * FROM courses WHERE is_active = TRUE ORDER BY sort_order"
  ).all();
  const courses: Course[] = [];

  for (const row of courseRows.results as any[]) {
    const features = await db.prepare(
      "SELECT feature FROM course_features WHERE course_id = ? ORDER BY sort_order"
    ).bind(row.id).all();

    const teacherLinks = await db.prepare(
      "SELECT teacher_id FROM course_teachers WHERE course_id = ?"
    ).bind(row.id).all();

    const cases = await db.prepare(
      "SELECT * FROM student_cases WHERE course_id = ?"
    ).bind(row.id).all();

    const teachers: Teacher[] = [];
    for (const link of teacherLinks.results as any[]) {
      const t = await db.prepare("SELECT * FROM teachers WHERE id = ?").bind(link.teacher_id).first();
      if (t) {
        teachers.push({
          name: (t as any).name,
          description: (t as any).description || "",
          image: (t as any).image || "",
        });
      }
    }

    courses.push({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle || "",
      description: row.description || "",
      features: (features.results as any[]).map((f: any) => f.feature),
      image: row.image || "",
      color: row.color || "",
      teachers,
      studentCases: (cases.results as any[]).map((c: any) => ({
        name: c.name,
        time: c.time || "",
        workImage: c.work_image || "",
      })),
    });
  }

  return courses;
}

async function seedDefaultContent(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const sections = [
    {
      section: "hero",
      title: defaultContent.hero.title,
      subtitle: defaultContent.hero.subtitle,
      description: defaultContent.hero.ctaText,
      data: JSON.stringify({ backgroundImage: defaultContent.hero.backgroundImage }),
    },
    {
      section: "about",
      title: defaultContent.about.title,
      subtitle: "",
      description: defaultContent.about.description,
      data: JSON.stringify({ stats: defaultContent.about.stats, image: defaultContent.about.image }),
    },
    {
      section: "contact",
      title: defaultContent.contact.title,
      subtitle: "",
      description: defaultContent.contact.description,
      data: JSON.stringify({
        phone: defaultContent.contact.phone,
        email: defaultContent.contact.email,
        address: defaultContent.contact.address,
        wechat: defaultContent.contact.wechat,
      }),
    },
    {
      section: "footer",
      title: defaultContent.footer.slogan,
      subtitle: defaultContent.footer.copyright,
      description: "",
      data: "{}",
    },
  ];

  for (const s of sections) {
    await db.prepare(
      "INSERT OR IGNORE INTO site_content (section, title, subtitle, description, data) VALUES (?, ?, ?, ?, ?)"
    ).bind(s.section, s.title, s.subtitle, s.description, s.data).run();
  }

  for (let i = 0; i < defaultContent.courses.length; i++) {
    const c = defaultContent.courses[i];
    await db.prepare(
      "INSERT OR IGNORE INTO courses (id, title, subtitle, description, image, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(c.id, c.title, c.subtitle, c.description, c.image, c.color, i).run();

    for (let j = 0; j < c.features.length; j++) {
      await db.prepare(
        "INSERT INTO course_features (course_id, feature, sort_order) VALUES (?, ?, ?)"
      ).bind(c.id, c.features[j], j).run();
    }
  }

  await db.prepare(
    "INSERT OR IGNORE INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)"
  ).bind("admin", bcrypt.hashSync("admin888", 10), "admin@example.com").run();
}

export async function updateContent(db: D1Database, content: SiteContent): Promise<void> {
  const sections = [
    {
      section: "hero",
      title: content.hero.title,
      subtitle: content.hero.subtitle,
      description: content.hero.ctaText,
      data: JSON.stringify({ backgroundImage: content.hero.backgroundImage }),
    },
    {
      section: "about",
      title: content.about.title,
      subtitle: "",
      description: content.about.description,
      data: JSON.stringify({ stats: content.about.stats, image: content.about.image }),
    },
    {
      section: "contact",
      title: content.contact.title,
      subtitle: "",
      description: content.contact.description,
      data: JSON.stringify({
        phone: content.contact.phone,
        email: content.contact.email,
        address: content.contact.address,
        wechat: content.contact.wechat,
      }),
    },
    {
      section: "footer",
      title: content.footer.slogan,
      subtitle: content.footer.copyright,
      description: "",
      data: "{}",
    },
  ];

  for (const s of sections) {
    await db.prepare(
      `INSERT INTO site_content (section, title, subtitle, description, data)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(section) DO UPDATE SET
         title = excluded.title,
         subtitle = excluded.subtitle,
         description = excluded.description,
         data = excluded.data,
         updated_at = CURRENT_TIMESTAMP`
    ).bind(s.section, s.title, s.subtitle, s.description, s.data).run();
  }

  // 课程全量替换：清空后重新插入
  await db.prepare("DELETE FROM course_features").run();
  await db.prepare("DELETE FROM course_teachers").run();
  await db.prepare("DELETE FROM student_cases").run();
  await db.prepare("DELETE FROM teachers").run();
  await db.prepare("DELETE FROM courses").run();

  for (let i = 0; i < content.courses.length; i++) {
    const c = content.courses[i];
    await db.prepare(
      "INSERT INTO courses (id, title, subtitle, description, image, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(c.id, c.title, c.subtitle, c.description, c.image, c.color, i).run();

    for (let j = 0; j < c.features.length; j++) {
      await db.prepare(
        "INSERT INTO course_features (course_id, feature, sort_order) VALUES (?, ?, ?)"
      ).bind(c.id, c.features[j], j).run();
    }

    for (const teacher of c.teachers) {
      if (!teacher.name) continue;
      const result = await db.prepare(
        "INSERT INTO teachers (name, description, image) VALUES (?, ?, ?)"
      ).bind(teacher.name, teacher.description, teacher.image).run();
      const teacherId = result.meta?.last_row_id;
      if (teacherId) {
        await db.prepare(
          "INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)"
        ).bind(c.id, teacherId).run();
      }
    }

    for (const sc of c.studentCases) {
      if (!sc.name) continue;
      await db.prepare(
        "INSERT INTO student_cases (course_id, name, time, work_image) VALUES (?, ?, ?, ?)"
      ).bind(c.id, sc.name, sc.time, sc.workImage).run();
    }
  }
}

export async function resetContent(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM course_features").run();
  await db.prepare("DELETE FROM course_teachers").run();
  await db.prepare("DELETE FROM student_cases").run();
  await db.prepare("DELETE FROM teachers").run();
  await db.prepare("DELETE FROM courses").run();
  await db.prepare("DELETE FROM site_content").run();
  await seedDefaultContent(db);
}

export async function deleteCourse(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM course_features WHERE course_id = ?").bind(id).run();
  const teacherLinks = await db.prepare("SELECT teacher_id FROM course_teachers WHERE course_id = ?").bind(id).all();
  await db.prepare("DELETE FROM course_teachers WHERE course_id = ?").bind(id).run();
  for (const link of teacherLinks.results as any[]) {
    await db.prepare("DELETE FROM teachers WHERE id = ?").bind(link.teacher_id).run();
  }
  await db.prepare("DELETE FROM student_cases WHERE course_id = ?").bind(id).run();
  await db.prepare("DELETE FROM courses WHERE id = ?").bind(id).run();
}

// ==================== 咨询管理 ====================

export async function getInquiries(db: D1Database): Promise<Inquiry[]> {
  const result = await db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
  return (result.results as any[]).map((r: any) => ({
    id: String(r.id),
    name: r.name,
    phone: r.phone,
    email: r.email || "",
    course: r.course_id || "",
    message: r.message || "",
    status: r.status || "pending",
    createdAt: r.created_at,
  }));
}

export async function addInquiry(
  db: D1Database,
  inquiry: { name: string; phone: string; course?: string; message?: string }
): Promise<void> {
  await db.prepare(
    "INSERT INTO inquiries (name, phone, course_id, message) VALUES (?, ?, ?, ?)"
  ).bind(inquiry.name, inquiry.phone, inquiry.course || "", inquiry.message || "").run();
}

export async function deleteInquiry(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM inquiries WHERE id = ?").bind(Number(id)).run();
}

// ==================== 管理后台认证 ====================

export async function verifyAdmin(db: D1Database, password: string): Promise<boolean> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const result = await db.prepare(
    "SELECT password_hash FROM admin_users WHERE username = 'admin' LIMIT 1"
  ).first();
  
  if (!result) {
    await db.prepare(
      "INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)"
    ).bind("admin", bcrypt.hashSync("admin888", 10), "admin@example.com").run();
    return password === "admin888";
  }
  
  return bcrypt.compareSync(password, (result as any).password_hash);
}