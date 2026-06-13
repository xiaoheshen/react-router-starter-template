// 默认网站内容配置，后台可编辑修改
export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  image: string;
  color: string; // tailwind color class for card accent
}

export interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    backgroundImage: string;
  };
  courses: Course[];
  about: {
    title: string;
    description: string;
    stats: { label: string; value: string }[];
    image: string;
  };
  contact: {
    title: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    wechat: string;
  };
  footer: {
    slogan: string;
    copyright: string;
  };
}

export const defaultContent: SiteContent = {
  hero: {
    title: "发现孩子的艺术天赋",
    subtitle: "专注初中小学美术 · 吉他兴趣 · 趣味书法 · 舞蹈培训，让每个孩子都能绽放光彩",
    ctaText: "立即预约试听课",
    backgroundImage: "",
  },
  courses: [
    {
      id: "art",
      title: "初中小学美术",
      subtitle: "用画笔描绘世界",
      description:
        "从素描基础到色彩创作，系统培养孩子的观察力、想象力和审美能力。针对不同年龄段设置阶梯式课程，让每个孩子都能找到适合自己的表达方式。",
      features: ["素描基础", "水彩技法", "创意手工", "艺术鉴赏", "写生实践"],
      image: "",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "guitar",
      title: "吉他兴趣课",
      subtitle: "弹奏青春的旋律",
      description:
        "零基础也能轻松入门！从认识六线谱到弹唱流行歌曲，寓教于乐的教学方式让孩子在音乐中找到自信与快乐。小班教学，保证每个孩子都能得到充分指导。",
      features: ["乐理基础", "和弦弹奏", "指弹技巧", "流行弹唱", "舞台表演"],
      image: "",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "calligraphy",
      title: "趣味书法",
      subtitle: "一笔一划书写人生",
      description:
        "打破传统书法教学的枯燥，融入趣味故事和互动游戏，让孩子在轻松愉快的氛围中掌握硬笔和软笔书法技巧，培养专注力和耐心。",
      features: ["硬笔书法", "软笔书法", "趣味临摹", "作品创作", "书法文化"],
      image: "",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "dance",
      title: "舞蹈培训",
      subtitle: "舞动梦想的翅膀",
      description:
        "涵盖中国舞、街舞、芭蕾基础等多种舞蹈类型，专业的舞蹈教室和资深教师团队，让孩子在优美的音乐中塑造形体、提升气质。",
      features: ["中国舞", "街舞基础", "芭蕾形体", "舞蹈考级", "汇报演出"],
      image: "",
      color: "from-violet-500 to-purple-500",
    },
  ],
  about: {
    title: "关于我们",
    description:
      "我们是一家专注于青少年艺术教育的综合性培训机构，致力于为中小学生提供高品质的美术、音乐、书法和舞蹈课程。自成立以来，我们始终坚持「以孩子为中心」的教学理念，为每一位学员量身定制学习方案，让艺术成为孩子成长路上最美的陪伴。",
    stats: [
      { label: "年教学经验", value: "5+" },
      { label: "在读学员", value: "500+" },
      { label: "专业教师", value: "20+" },
      { label: "课程类型", value: "4" },
    ],
    image: "",
  },
  contact: {
    title: "联系我们",
    description: "有任何问题或想预约试听课？欢迎随时联系我们，我们会在第一时间回复您！",
    phone: "138-0000-0000",
    email: "hello@example.com",
    address: "XX市XX区XX路XX号",
    wechat: "artstudio666",
  },
  footer: {
    slogan: "让每个孩子都能绽放光彩",
    copyright: "© 2026 艺术培训工作室. All rights reserved.",
  },
};