# 内容管理模块功能增强 - 实施计划

## Context

当前后台管理系统的内容管理模块支持首页横幅、课程、关于我们、联系方式和页脚的基本文本编辑，但缺少以下能力：
- 横幅文字/按钮的独立颜色配置
- 横幅背景图片上传时会自动压缩，无法保持原始分辨率
- "关于我们"页面的配图区域仅有 emoji 占位符，无法上传真实图片
- 联系方式页面的地图区域仅有 emoji 占位符，无法上传真实地图图片

本次增强将为这三个功能模块补齐图片管理和颜色配置能力，所有修改遵循现有代码模式。

## 涉及文件

| 文件 | 修改类型 |
|------|----------|
| `app/data/content.ts` | 类型扩展 + 默认值 |
| `app/data/store.ts` | JSON 序列化更新 |
| `app/components/ImageUploader.tsx` | 新增 props |
| `app/components/Hero.tsx` | 颜色 props + 动态样式 |
| `app/routes/admin/content.tsx` | 管理后台 UI 新增 |
| `app/routes/front/home.tsx` | 传递新 props |
| `app/routes/front/about.tsx` | 图片渲染 |
| `app/routes/front/contact.tsx` | 地图图片渲染 |

## 实施步骤

### 阶段一：数据层扩展（`content.ts` + `store.ts`）

**1. `app/data/content.ts` — 扩展 SiteContent 接口和默认值**

- Hero 新增 4 个颜色字段：`titleColor`、`subtitleColor`、`ctaBgColor`、`ctaTextColor`
- Contact 新增 `mapImage` 字段
- 在 `defaultContent` 中为所有新字段提供默认值（颜色默认值与现有 Tailwind 类对应）

**2. `app/data/store.ts` — 更新 JSON 序列化**

- `seedDefaultContent()`：hero data JSON 增加 4 个颜色字段；contact data JSON 增加 `mapImage`
- `getContent()`：hero 解析增加 4 个颜色字段带 fallback；contact 解析增加 `mapImage` 带 fallback
- `updateContent()`：hero data 序列化增加 4 个颜色字段；contact data 序列化增加 `mapImage`

### 阶段二：ImageUploader 组件增强（`ImageUploader.tsx`）

**3. 新增 `noCompress` 和 `previewFit` props**

- `noCompress`（默认 false）：为 true 时跳过压缩，直接读取原始文件为 base64
- `previewFit`（默认 "cover"）：控制预览图片的 `object-fit` CSS 属性，支持 "contain" 等比例缩放
- 修改 `handleFileChange` 中的压缩逻辑：`noCompress` 优先于 `isSmallFile` 判断
- 修改预览 `<img>` 的 className 使用动态 `object-fit`
- 修改提示文字：`noCompress` 时不显示"自动压缩"

### 阶段三：首页横幅颜色管理（Feature 1）

**4. `app/components/Hero.tsx` — 支持颜色 props**

- 新增 4 个可选颜色 props：`titleColor`、`subtitleColor`、`ctaBgColor`、`ctaTextColor`
- 标题和副标题：移除硬编码的 `text-gray-900`/`text-gray-500`，改用 `style={{ color: ... }}` 内联样式
- CTA 按钮：移除 `bg-gradient-to-r from-blue-600 to-purple-600 text-white`，改用 `style={{ backgroundColor, color }}` 内联样式

**5. `app/routes/front/home.tsx` — 传递颜色 props**

- 将 `hero.titleColor` 等 4 个新字段传递给 `<Hero>` 组件

**6. `app/routes/admin/content.tsx` — Hero Tab 新增颜色选择器**

- 在 Hero Tab 末尾（背景预览之前）新增"颜色设置"区块
- 使用 2×2 或 4 列网格布局，每项包含 `<input type="color">` + 文本输入框
- 4 个颜色字段：标题颜色、副标题颜色、按钮背景色、按钮文字色
- 更新横幅背景 `ImageUploader` 调用：增加 `noCompress={true}` 和 `previewFit="contain"`
- 优化背景预览区域：使用 `object-contain` 等比例显示完整图片

### 阶段四："关于我们"图片管理（Feature 2）

**7. `app/routes/admin/content.tsx` — About Tab 新增图片上传**

- 在 About Tab 描述字段后添加 `ImageUploader` 组件绑定 `about.image`
- 添加图片预览区域（`aspect-square` 等比例）

**8. `app/routes/front/about.tsx` — 渲染 about.image**

- 城堡区域：若 `about.image` 存在则渲染 `<img>`，否则显示原有 🏫 emoji 占位符

**9. `app/routes/front/home.tsx` — 首页 about 区域也使用图片**

- 首页 about 区域：同样使用 `about.image` 条件渲染

### 阶段五：联系方式地图图片管理（Feature 3）

**10. `app/routes/admin/content.tsx` — Contact Tab 新增地图上传**

- 在 Contact Tab 末尾新增"地图展示"区块
- 添加 `ImageUploader` 组件绑定 `contact.mapImage`，使用 `previewFit="contain"`
- 添加地图预览区域（`aspect-[4/3]` 等比例）

**11. `app/routes/front/contact.tsx` — 渲染地图图片**

- 地图区域：若 `contact.mapImage` 存在则渲染 `<img>`，否则显示原有 🗺️ emoji 占位符

## 技术决策

1. **颜色存储**：使用 hero 的 JSON `data` 字段，与 `backgroundImage` 存储方式一致，无需 schema 变更
2. **动态颜色实现**：使用 React inline `style` 而非动态 Tailwind 类（Tailwind 在编译时生成类，动态类名不可用）
3. **图片压缩控制**：复用 `ImageUploader` 中已有的 `readFileAsDataURL` 函数，通过 `noCompress` prop 暴露
4. **向后兼容**：所有新字段使用 `|| defaultValue` fallback 模式，兼容已有数据库数据
5. **权限控制**：沿用 admin layout 中已有的 cookie-based 认证（`admin_token=authenticated`）
6. **数据验证**：复用 `validateImageFile` 进行格式/大小验证；颜色字段为可选，无需额外验证

## 验证方案

1. **构建验证**：运行 `npm run build` 确保 TypeScript 编译无错误
2. **功能验证**：
   - 登录后台 → 内容管理 → 首页横幅：修改 4 个颜色值 → 保存 → 刷新首页查看颜色变化
   - 上传横幅背景图 → 确认图片未压缩（检查 base64 大小）→ 预览区域等比例显示完整图片
   - 关于我们 Tab → 上传配图 → 预览 → 保存 → 刷新关于我们页面查看
   - 联系方式 Tab → 上传地图图片 → 预览 → 保存 → 刷新联系方式页面查看响应式显示
3. **回退验证**：确认无图片时各页面仍显示原始 emoji 占位符