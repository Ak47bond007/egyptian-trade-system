# نظام إدارة المراسلات - التمثيل التجاري المصري
# Egyptian Trade System - Correspondence Management

## 🏛️ نظرة عامة | Overview

نظام شامل لإدارة المراسلات الواردة والصادرة مصمم خصيصاً للتمثيل التجاري المصري. يوفر النظام جميع الأدوات المطلوبة لإدارة المراسلات بكفاءة عالية مع دعم العمل الجماعي والمزامنة الفورية.

A comprehensive correspondence management system designed specifically for Egyptian Commercial Representation offices. The system provides all necessary tools for efficient correspondence management with real-time collaboration and synchronization features.

## ✨ الميزات الرئيسية | Key Features

### 📝 إدارة المراسلات الكاملة | Complete Correspondence Management
- ✅ إضافة، تعديل، حذف، واستعراض المراسلات
- ✅ تصنيف المراسلات (وارد/صادر) مع مستويات الأولوية
- ✅ تتبع الحالات والمواعيد النهائية
- ✅ ترقيم تلقائي للمراجع

### 🔍 البحث والتصفية المتقدمة | Advanced Search & Filtering
- ✅ بحث فوري عبر جميع حقول المراسلات
- ✅ تصفية متعددة المعايير (النوع، الحالة، الإدارة)
- ✅ نتائج البحث الفورية

### 📎 إدارة المرفقات | Attachment Management
- ✅ رفع ملفات متعددة بتقنية السحب والإفلات
- ✅ دعم جميع أنواع الملفات (PDF, Word, Excel, الصور)
- ✅ عرض وطباعة المرفقات

### 📊 التصدير والاستيراد | Import/Export
- ✅ تصدير إلى Excel مع التنسيق العربي
- ✅ تصدير/استيراد JSON
- ✅ نظام النسخ الاحتياطية

### 🤖 البوسطجي الذكي | Smart Postman
- ✅ مساعد ذكي باللغة العربية
- ✅ بحث واستعلامات ذكية
- ✅ واجهة دردشة عائمة أنيقة

### 🌐 قاعدة البيانات المركزية | Centralized Database
- ✅ عمل مشترك لجميع الأجهزة على الشبكة
- ✅ مزامنة فورية بين المستخدمين
- ✅ حماية من التعارضات في التحرير

## 🛠️ التقنيات المستخدمة | Technology Stack

### Backend
- **Flask** - إطار العمل الخلفي
- **SQLAlchemy** - إدارة قاعدة البيانات
- **Flask-SocketIO** - الاتصال الفوري
- **OpenPyXL** - معالجة ملفات Excel

### Frontend
- **Bootstrap 5** - تصميم متجاوب
- **Bootstrap Icons** - مكتبة الأيقونات
- **Socket.IO** - الاتصال الفوري
- **CSS مخصص** - تصميم عربي احترافي

## 🚀 التثبيت والتشغيل | Installation & Setup

### المتطلبات | Prerequisites
- Python 3.8+
- متصفح ويب حديث

### خطوات التثبيت | Installation Steps

```bash
# 1. تحميل المشروع | Clone the repository
git clone https://github.com/Ak47bond007/egyptian-trade-system.git
cd egyptian-trade-system

# 2. تثبيت المتطلبات | Install dependencies
pip install -r requirements.txt

# 3. تشغيل النظام | Run the application
python app.py
```

### الوصول للنظام | Access the System
- **الرابط | URL:** http://localhost:5000
- **اسم المستخدم | Username:** admin
- **كلمة المرور | Password:** admin123

## 📱 لقطات الشاشة | Screenshots

![لوحة التحكم | Dashboard](https://github.com/user-attachments/assets/d09781ae-a3df-4621-8565-4ad8c2e6a3c1)

## 📚 الوثائق | Documentation

- **[دليل المستخدم | User Guide](USER_GUIDE.md)** - دليل شامل لاستخدام النظام
- **[الوثائق التقنية | Technical Documentation](TECHNICAL_DOCS.md)** - وثائق تقنية مفصلة للمطورين

## 🏗️ هيكل المشروع | Project Structure

```
egyptian-trade-system/
├── app.py                 # التطبيق الرئيسي | Main application
├── models.py              # نماذج قاعدة البيانات | Database models
├── requirements.txt       # المتطلبات | Dependencies
├── static/               # الملفات الثابتة | Static files
│   ├── css/
│   ├── js/
│   └── images/
├── templates/            # قوالب HTML | HTML templates
│   ├── base.html
│   ├── dashboard.html
│   ├── login.html
│   └── correspondences/
└── instance/             # قاعدة البيانات | Database files
```

## 🔧 الإعدادات | Configuration

### بيانات الدخول الافتراضية | Default Credentials
- المدير الرئيسي: `admin` / `admin123`

### تخصيص النظام | Customization
- تغيير الألوان والشعارات في `static/css/style.css`
- إضافة ميزات جديدة في `app.py`
- تعديل قوالب HTML في مجلد `templates/`

## 🤝 المساهمة | Contributing

هذا النظام مطور خصيصاً للتمثيل التجاري المصري. للمساهمة في التطوير:

1. Fork المشروع
2. إنشاء فرع جديد للميزة
3. إرسال Pull Request

## 🛡️ الأمان | Security

- تشفير كلمات المرور
- حماية من هجمات CSRF
- تسجيل جميع الأنشطة
- تخزين محلي آمن للبيانات

## 📞 الدعم التقني | Technical Support

للدعم التقني والاستفسارات:
- استخدم البوسطجي الذكي داخل النظام
- راجع الوثائق المرفقة
- فحص سجلات النظام للأخطاء

## 📄 الترخيص | License

هذا النظام مطور خصيصاً لوزارة الاستثمار والتجارة الخارجية - التمثيل التجاري المصري

---

**© 2024 وزارة الاستثمار والتجارة الخارجية - التمثيل التجاري المصري**

**Developed for Egyptian Commercial Representation - Ministry of Investment and Foreign Trade**
