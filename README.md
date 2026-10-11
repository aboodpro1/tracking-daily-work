# 🎯 إنجاز | Enjaz — Daily Tracking & Kanban Management System

[![n8n Integration](https://img.shields.io/badge/Workflow-n8n-FF6D5A?style=flat-square&logo=n8n&logoColor=white)](https://n8n.io)
[![Database](https://img.shields.io/badge/Database-Notion-000000?style=flat-square&logo=notion&logoColor=white)](https://notion.so)
[![UI Design](https://img.shields.io/badge/Design-Vanilla%20CSS%20%2B%20Glassmorphism-2563EB?style=flat-square)](./src/assets/styles/main.css)
[![Architecture](https://img.shields.io/badge/Architecture-Webhook%20%E2%86%92%20Switch%20%E2%86%92%20Action-D4AF37?style=flat-square)](./docs/n8n/how-to-build-a-flow.md)

نظام متكامل واحترافي لإدارة ومتابعة المهام اليومية (Kanban Board) مبني بالكامل على تقنيات الويب الحديثة، مع تكامل مباشر وفوري مع **Notion Database** عبر أتمتة **n8n Workflows**.

---

## 📑 جدول المحتويات (Table of Contents)

1. [نظرة عامة على المشروع (Overview)](#-نظرة-عامة-على-المشروع-overview)
2. [المميزات الرئيسية (Key Features)](#-المميزات-الرئيسية-key-features)
3. [معمارية النظام وتدفق البيانات (System Architecture)](#-معمارية-النظام-وتدفق-البيانات-system-architecture)
4. [هيكلية مسارات العمل في n8n (n8n Workflows)](#-هيكلية-مسارات-العمل-في-n8n-n8n-workflows)
5. [قواعد بيانات Notion (Database Schema)](#-قواعد-بيانات-notion-database-schema)
6. [دليل هيكل الملفات (Project Structure)](#-دليل-هيكل-الملفات-project-structure)
7. [طريقة التشغيل والتثبيت (Getting Started)](#-طريقة-التشغيل-والتثبيت-getting-started)
8. [أدلة التطوير ومعايير الـ AI (Guidelines)](#-أدلة-التطوير-ومعايير-الـ-ai-guidelines)

---

## 🌟 نظرة عامة على المشروع (Overview)

تم تصميم تطبيق **إنجاز** ليكون لوحة تحكم ومتابعة يومية فائقة السرعة والجمال، تدعم اللغة العربية بالكامل وبخط **Tajawal** الحديث، مع تجربة مستخدم تعتمد على **Glassmorphism** والتدرجات الضوئية الفاخرة (Royal Blue & Metallic Gold).

يقوم النظام بمزامنة المهام الخاصة بكل مستخدم مسجل مع قاعدة بيانات Notion لحظياً، مع دعم السحب والإفلات وتوليد المعرفات الحصرية للمهام.

---

## 🚀 المميزات الرئيسية (Key Features)

### 1. 🔐 بوابة المصادقة وإدارة الجلسات (`auth.html`)
- تسجيل دخول وإنشاء حسابات جديدة مع تحديد الصلاحيات (`Admin`, `Lead`, `Member`).
- حفظ آمن للجلسة عبر `localStorage` (`auth_token`, `auth_user`).
- التحقق التلقائي من صحة الجلسة عند كل فتح أو تحديث للصفحة (**Session Guard on Refresh**).
- تأثير تحميل تفاعلي متطور مع تدرج لوني متحرك ومؤشر دوران سلس.

### 2. 📝 نموذج إضافة المهام (`add-task.html`)
- إضافة مهام مفصلة: العنوان، الوصف، التصنيف (دينية، جسم، شغل، دراسة)، الأهمية، والوقت المتوقع.
- ربط المهمة تلقائياً بالمعرّف الفريد للمستخدم المصادق (`userId`).
- توليد معرفات حصرية للمهمة (`ID_task`) لمنع التكرار وضمان تتبعها.

### 3. 📋 لوحة كانبان التفاعلية (`board.html`)
- تنظيم فوري للمهام في 3 أقسام رئيسية:
  - ⏳ **قيد الانتظار** (`pending` / `Not started`)
  - ⚙️ **قيد التنفيذ** (`progress` / `In progress`)
  - ✅ **مكتملة** (`completed` / `Done`)
- فلترة تلقائية لعرض مهام اليوم الحالي فقط مع عرض التاريخ بالعربية.
- دعم كامل للسحب والإفلات (**Drag & Drop**) مع تحديث فوري للحالة على خادم Notion عبر مسار POST.
- إحصائيات حية: عداد المهام ونسبة الإنجاز المئوية.
- إمكانية استرجاع موضع البطاقة تلقائياً في حال فشل الاتصال مع الخادم (**Rollback on Error**).

---

## 🏗️ معمارية النظام وتدفق البيانات (System Architecture)

تتبع جميع واجهات ومسارات العمل نمطاً معمارياً موحداً يضمن القابلية للتوسع والتحكم:

```text
┌─────────────────────────────────────────────────────────────┐
│                       Frontend UI                           │
│   (index.html / auth.html / add-task.html / board.html)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Axios HTTP (GET / POST)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    n8n Webhook Ingress                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Central Switch / Router                    │
│   ├── User Sign In / Sign Up Branch                         │
│   ├── Add Task Branch (Generate ID_task + Validate User)    │
│   ├── Update Task Status Branch (Sync Drag-and-Drop)        │
│   └── Get Board Tasks Branch (Strict User Scoped Query)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Notion Databases                         │
│   ├── Users Database: 3dc6fd16-45b0-80ff-8435-c255ed191886  │
│   └── Tasks Database: 3dc6fd16-45b0-8072-9e75-fb87ba35ed28  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Truthful Response Handling                    │
│    (HTTP 200 Success JSON  /  HTTP 4xx/5xx Real Error JSON) │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 هيكلية مسارات العمل في n8n (n8n Workflows)

تتوفر كافة ملفات مسارات العمل بصيغة JSON قابلة للاستيراد المباشر في n8n:

| مسار العمل (Workflow) | الملف الرئيسي | الوصف والمسار في n8n |
| :--- | :--- | :--- |
| **POST Workflow** | [`task-post.json`](./workflows/n8n/task-post.json) | معالجة إضافة المهام الجديدة وتحديث حالات المهام عند السحب والإفلات. |
| **Board GET Workflow** | [`board-get-user-tasks.json`](./workflows/n8n/board-get-user-tasks.json) | جلب مهام المستخدم المصادق فقط وفلترتها مع إرجاع بيانات مهيكلة للوحة. |
| **Auth Workflow** | [`auth.json`](./workflows/n8n/auth.json) | تسجيل الدخول، إنشاء الحسابات، والتحقق من صلاحية الجلسة. |

### نمط الـ Webhook $\rightarrow$ Switch المعتمد:
```text
Webhook (استقبال الطلب)
   ↓
Switch (التوجيه حسب الإجراء)
   ├── [Get All Tasks] ──► تحقق المستخدم ──► استعلام Notion ──► فلترة المهام ──► استجابة 200
   └── [Fallback]      ──► معالجة الإجراء الخاطئ ─────────────────────────────► استجابة 400
```

---

## 🗄️ قواعد بيانات Notion (Database Schema)

### 1. قاعدة بيانات المستخدمين (Users Database)
- **Database ID**: `3dc6fd16-45b0-80ff-8435-c255ed191886`
- **الحقول الرئيسية**: `Name` (title), `Email` (email), `Password` (rich_text), `User ID` (rich_text), `Role` (select: Admin, Lead, Member), `Status` (select: Active, Inactive).

### 2. قاعدة بيانات المهام (Tasks Database)
- **Database ID**: `3dc6fd16-45b0-8072-9e75-fb87ba35ed28`
- **الحقول الرئيسية**:
  - `العنوان` (`title`): عنوان المهمة
  - `الوصف` (`rich_text`): تفاصيل المهمة
  - `الحالة` (`select`): قيد الانتظار / قيد التنفيذ / مكتملة
  - `التصنيف` (`select`): دينية / جسم / شغل / دراسة
  - `الأهمية` (`select`): مهمة / عادية
  - `الوقت المتوقع` (`select`): أقل من ساعة / ساعة / ساعتان
  - `date` (`date`): تاريخ المهمة
  - `ID_task` (`rich_text`): المعرف الفريد للمهمة
  - `user ID` (`rich_text`): معرّف المستخدم المالك للمهمة
  - `Assigned User` (`relation`): علاقة ثنائية مع جدول المستخدمين

---

## 📁 دليل هيكل الملفات (Project Structure)

```text
tracking-daily-work/
├── index.html                        # الصفحة التعريفية (Landing) — نقطة الدخول في جذر المشروع
├── src/                              # كود التطبيق (الصفحات، الأنماط، السكربتات)
│   ├── auth.html                     # تسجيل الدخول وإنشاء حساب
│   ├── add-task.html                 # إضافة مهمة جديدة
│   ├── board.html                    # لوحة كانبان (مهام اليوم)
│   │
│   ├── assets/
│   │   └── styles/main.css           # نظام التصميم الموحد والأنماط البصرية
│   │
│   ├── config/
│   │   └── app-config.js             # روابط الـ Webhooks ومسارات الصفحات (مصدر واحد)
│   │
│   ├── shared/                       # كود مشترك بين كل الميزات
│   │   ├── services/
│   │   │   ├── api-client.js         # غلاف axios + أدوات قراءة الاستجابة
│   │   │   └── session-store.js      # إدارة الجلسة في localStorage (AuthSession)
│   │   ├── ui/
│   │   │   ├── toast.js              # إشعارات Toast
│   │   │   └── page-transitions.js   # شريط التقدم أثناء التنقل
│   │   └── utils/
│   │       └── escape-html.js        # الحماية من XSS
│   │
│   └── features/                     # مقسمة حسب الميزة (Feature Folders)
│       ├── auth/
│       │   ├── auth-service.js       # طلبات الشبكة: دخول، تسجيل، تحقق من الجلسة
│       │   ├── auth-guard.js         # حماية الصفحات، شريط المستخدم، تسجيل الخروج
│       │   └── auth-page.js          # واجهة صفحة الدخول (تبويبات، نماذج)
│       ├── tasks/
│       │   ├── task-service.js       # طلبات الشبكة: جلب، إضافة، تحديث، حذف
│       │   ├── task-mappers.js       # تحويل وتوحيد بيانات المهام (بدون DOM)
│       │   ├── add-task.js           # واجهة نموذج إضافة مهمة
│       │   └── board.js              # واجهة لوحة كانبان والسحب والإفلات
│       └── landing/
│           └── landing-demo.js       # العرض التفاعلي في الصفحة التعريفية
│
├── workflows/n8n/                    # مسارات عمل n8n القابلة للاستيراد
│   ├── auth.json
│   ├── task-post.json
│   └── board-get-user-tasks.json
│
├── docs/
│   ├── architecture/                 # شرح المنطق التقني ومخطط قاعدة البيانات
│   ├── guidelines/                   # معايير الواجهة وهيكلة المشروع
│   └── n8n/                          # دليل بناء مسارات n8n
│
├── deploy/nginx.conf                 # إعدادات Nginx
├── Dockerfile                        # صورة الإنتاج (تنسخ index.html و src/ فقط)
└── package.json                      # سكربتات التشغيل المحلي وDocker
```

### قواعد الهيكلة المتبعة
- **`index.html` في جذر المشروع** (نقطة الدخول الافتراضية للخادم)، وكل صفحات التطبيق داخل `src/` وتعود إليها عبر `../index.html`.
- **أسماء الملفات والمجلدات** بصيغة `kebab-case` (أحرف صغيرة وشرطات، بدون مسافات).
- **فصل طبقة الشبكة عن الواجهة:** كل طلبات `axios` موجودة في ملفات `*-service.js` فقط، وملفات الواجهة تستدعي الخدمة.
- **لا يوجد CSS أو JS مضمّن (inline)** داخل ملفات HTML؛ الأحداث تُربط عبر `addEventListener` و`data-action`.
- **مصدر واحد للإعدادات:** لتغيير رابط الخادم أو التبديل لبيئة الاختبار عدّل `API_MODE` في `src/config/app-config.js`.
- **ترتيب تحميل السكربتات:** `config` ← `shared` ← `features/*/…-service.js` ← ملف الصفحة.

---

## ⚡ طريقة التشغيل والتثبيت (Getting Started)

### 1. تشغيل الواجهة الأمامية محلياً:
يمكن تشغيل المشروع باستخدام أي خادم محلي ثابت (مثل Live Server في VS Code):
```bash
npm run dev          # يشغّل المشروع على http://localhost:3000
```
ثم افتح المتصفح على: `http://localhost:3000/` (الصفحة التعريفية) أو `http://localhost:3000/src/auth.html`.

أو عبر Docker:
```bash
npm run docker:build
npm run docker:run   # http://localhost:8080
```

### 2. استيراد مسارات العمل في n8n:
1. افتح بيئة **n8n** الخاصة بك.
2. انقر على **Workflows** ثم **Import from File**.
3. قم باستيراد الملفات:
   - `workflows/n8n/task-post.json`
   - `workflows/n8n/board-get-user-tasks.json`
   - `workflows/n8n/auth.json`
4. تأكد من ضبط بيانات اعتماد Notion API Credential وتفعيل الـ Webhooks.

---

## 📖 أدلة التطوير ومعايير الـ AI (Guidelines)

لأي تعديل أو إضافة مستقبلية لمسارات العمل، يُرجى مراجعة الدليل المعماري المخصص:
- 📘 [دليل بناء مسارات n8n](./docs/n8n/how-to-build-a-flow.md)
- 📋 [تفاصيل مخطط قواعد بيانات Notion](./docs/architecture/notion-db-schema.md)
- 🔐 [منطق المصادقة والجلسة](./docs/architecture/auth-01-session-logic.md)
- 🗂️ [معايير هيكلة المشروع](./docs/guidelines/project-structure.md)
- 🎨 [قواعد تصميم الواجهة](./docs/guidelines/ui-rules.md)

---

<div align="center">
  <sub>صُمم وطُوّر بأعلى معايير الحرفة وجودة الأداء 🚀</sub>
</div>
