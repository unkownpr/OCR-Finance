# OCR Finance - Fatura Takip Sistemi

Modern, akıllı ve güvenli fatura yönetim uygulaması. OCR teknolojisi ile faturalarınızı otomatik okuyun ve finansal durumunuzu gerçek zamanlı takip edin.

![OCR Finance](https://img.shields.io/badge/version-1.0.0-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green)

## ✨ Özellikler

- 📸 **OCR Teknolojisi** - Tesseract.js ile fatura görsellerinden otomatik veri çıkarma
- 💰 **Finansal Takip** - Gelir ve giderleri detaylı olarak izleme
- 📊 **İstatistikler & Grafikler** - Recharts ile görsel finansal raporlar
- 👤 **Kullanıcı Yönetimi** - Supabase Auth ile güvenli kimlik doğrulama
- 🔐 **Admin Panel** - Sistem geneli yönetim ve istatistikler
- 📱 **PWA Desteği** - Mobil cihazlarda uygulama gibi çalışma
- 🎨 **Modern UI/UX** - Shadcn/ui ve Tailwind CSS ile dark-mode tasarım
- ☁️ **Cloud Storage** - Supabase Storage ile güvenli görsel depolama

## 🚀 Teknolojiler

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **OCR:** Tesseract.js
- **Charts:** Recharts
- **State Management:** Zustand

## 📋 Kurulum

### 1. Projeyi Klonlayın

\`\`\`bash
git clone <repository-url>
cd ocrfinance
\`\`\`

### 2. Bağımlılıkları Yükleyin

\`\`\`bash
npm install
\`\`\`

### 3. Ortam Değişkenlerini Ayarlayın

\`.env.local\` dosyası oluşturun:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Supabase Kurulumu

#### 4.1 Supabase Projesi Oluşturun
1. [Supabase](https://supabase.com) hesabı oluşturun
2. "New Project" butonuna tıklayın
3. Proje adı, database şifresi ve bölge seçin
4. Projenin hazır olmasını bekleyin (2-3 dakika)

#### 4.2 Database Schema'yı Çalıştırın
1. Supabase Dashboard'da "SQL Editor"e gidin
2. \`supabase-schema.sql\` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve "Run" butonuna tıklayın

Bu işlem:
- ✅ Users ve Invoices tablolarını oluşturur
- ✅ Storage bucket'ı hazırlar
- ✅ Row Level Security (RLS) politikalarını ayarlar
- ✅ İlk kullanıcı otomatik admin trigger'ını ekler
- ✅ Gerekli indexleri ve optimizasyonları yapar

#### 4.3 API Anahtarlarını Alın
1. Supabase Dashboard'da "Settings" > "API"ye gidin
2. \`Project URL\` ve \`anon public\` key'i \`.env.local\` dosyasına ekleyin

### 5. Uygulamayı Başlatın

\`\`\`bash
npm run dev
\`\`\`

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 🏗️ Proje Yapısı

\`\`\`
ocrfinance/
├── app/
│   ├── (auth)/           # Kimlik doğrulama sayfaları
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Dashboard layout ve sayfaları
│   │   └── dashboard/
│   │       ├── admin/    # Admin paneli
│   │       ├── invoices/ # Fatura yönetimi
│   │       ├── stats/    # İstatistikler
│   │       └── settings/ # Ayarlar
│   ├── layout.tsx
│   └── page.tsx          # Ana sayfa
├── components/
│   ├── invoices/         # Fatura bileşenleri
│   ├── layout/           # Layout bileşenleri
│   ├── providers/        # Context providers
│   └── ui/               # Shadcn/ui bileşenleri
├── lib/
│   ├── ocr.ts           # OCR işleme fonksiyonları
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Yardımcı fonksiyonlar
├── store/
│   └── auth-store.ts    # Zustand state yönetimi
├── types/
│   └── invoice.ts       # TypeScript tipleri
├── public/
│   └── manifest.json    # PWA manifest
└── supabase-schema.sql  # Database schema
\`\`\`

## 👤 Kullanıcı Rolleri

### Standart Kullanıcı
- Kendi faturalarını ekleyebilir, görüntüleyebilir, silebilir
- Kendi istatistiklerini görebilir
- Profil ayarlarını düzenleyebilir

### Admin Kullanıcı
- Tüm standart kullanıcı özellikleri
- Sistem geneli istatistikleri görüntüleme
- Tüm kullanıcıları ve faturalarını görme
- Admin paneline erişim

#### Admin Olma:
🎯 **İlk Kullanıcı** - Sistem yeni kurulduğunda ilk kaydolan kullanıcı otomatik admin olur

> 💡 **Not:** Sadece ilk kullanıcı otomatik admin yetkisi alır. Sonraki kullanıcılar normal kullanıcı olarak kaydedilir. Admin yetkisi sonradan database üzerinden manuel olarak verilebilir.

## 📱 PWA (Progressive Web App)

Uygulama PWA desteğine sahiptir ve mobil cihazlarda uygulama gibi çalışır.

**PWA Özellikleri:**
- ✅ Offline çalışma desteği
- ✅ Ana ekrana ekleme
- ✅ Tam ekran deneyimi
- ✅ Hızlı yükleme

**PWA Yükleme:**
1. Chrome/Edge tarayıcı ile uygulamayı açın
2. Adres çubuğunda "Yükle" ikonuna tıklayın
3. Veya Settings sayfasından manuel olarak yükleyin

**İkon Dosyaları (Opsiyonel):**

Daha iyi PWA deneyimi için ikon dosyaları oluşturabilirsiniz:
- \`public/icon-192.png\` (192x192 px)
- \`public/icon-512.png\` (512x512 px)

Online araçlar:
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Icon Generator](https://tools.crawlink.com/tools/pwa-icon-generator/)

## 🔒 Güvenlik

- Row Level Security (RLS) ile veri güvenliği
- Supabase Auth ile güvenli kimlik doğrulama
- Her kullanıcı yalnızca kendi verilerine erişebilir
- Admin yetkisi sadece belirli e-posta adreslerine otomatik verilir

## 🌐 Vercel Deploy

### 1. GitHub'a Push Edin

\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### 2. Vercel'e Deploy

#### Yöntem 1: GitHub üzerinden (Önerilen)
1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. "New Project" butonuna tıklayın
3. GitHub repository'nizi seçin ve import edin

#### Yöntem 2: Vercel CLI
\`\`\`bash
npm i -g vercel
vercel login
vercel
\`\`\`

### 3. Environment Variables Ekleyin

Vercel Dashboard'da "Settings" > "Environment Variables":

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

**Önemli:** Her iki environment variable için Production, Preview ve Development seçeneklerini işaretleyin.

### 4. Redeploy

Environment variables ekledikten sonra "Deployments" sekmesinden redeploy yapın.

### 5. Doğrulama

- ✅ Kayıt ol/Giriş yap işlevlerini test edin
- ✅ Fatura ekleme ve OCR'ı test edin
- ✅ Admin paneline erişimi kontrol edin
- ✅ PWA yükleme özelliğini test edin

## 📸 Ekran Görüntüleri

### Dashboard
Modern ve kullanıcı dostu arayüz ile finansal durumunuzu bir bakışta görün.

### OCR İşleme
Fatura görsellerini yükleyin ve OCR ile otomatik olarak bilgileri çıkarın.

### İstatistikler
Detaylı grafikler ve analizlerle finansal verilerinizi inceleyin.

## 🐛 Sorun Giderme

### "Settings fetch error" Uyarısı
Bu uyarı **normaldir** ve zararsızdır:
- ✅ \`site_settings\` tablosu henüz oluşturulmamış demektir
- ✅ Uygulama otomatik olarak varsayılan ayarları kullanır
- ✅ Hiçbir özellik etkilenmez, uygulama sorunsuz çalışır

**Çözüm Seçenekleri:**
1. **Görmezden gelin** - Uygulama tam işlevsel çalışacaktır
2. **Site ayarlarını aktifleştirin** - Admin panelinden tema ve ayarları özelleştirmek isterseniz:
   - \`supabase-schema-settings.sql\` dosyasını Supabase SQL Editor'de çalıştırın
   - Detaylı bilgi için \`SUPABASE_SETUP.md\` dosyasına bakın

### Supabase Bağlantı Hatası
- ✅ \`.env.local\` dosyasındaki environment variables'ları kontrol edin
- ✅ Supabase Project URL'in doğru olduğundan emin olun
- ✅ \`supabase-schema.sql\` dosyasının tamamen çalıştırıldığını kontrol edin
- ✅ RLS policies'in aktif olduğunu doğrulayın

### OCR Çalışmıyor
- ✅ İnternet bağlantısını kontrol edin (OCR worker dosyaları CDN'den indirilir)
- ✅ Tarayıcı console'da hata mesajlarına bakın
- ✅ Tesseract.js bağımlılığının yüklendiğini kontrol edin

### PWA Yüklenmiyor
- ✅ \`manifest.json\` dosyasının \`public/\` klasöründe olduğunu kontrol edin
- ✅ HTTPS kullandığınızdan emin olun (Vercel otomatik sağlar)
- ✅ İkon dosyalarının mevcut olduğunu kontrol edin

### Storage Upload Hatası
- ✅ Supabase Storage policies'ini kontrol edin
- ✅ \`invoices\` bucket'ının oluşturulduğundan emin olun
- ✅ Dosya boyutunun limitler içinde olduğunu kontrol edin

### Admin Paneline Erişemiyorum
- ✅ İlk kullanıcı olarak kayıt oldunuz mu?
- ✅ Database'de \`is_admin\` değerinin \`true\` olduğunu kontrol edin

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (\`git checkout -b feature/amazing-feature\`)
3. Commit edin (\`git commit -m 'feat: Add amazing feature'\`)
4. Push edin (\`git push origin feature/amazing-feature\`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 💬 İletişim

Sorularınız için: programc4@gmail.com

---

**Made with ❤️ using Next.js and Supabase**
