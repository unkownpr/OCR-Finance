# Supabase Kurulum Rehberi

Bu dosya, OCR Finance uygulaması için Supabase veritabanı kurulumunu açıklar.

## 📋 Gerekli Adımlar

### 1. Ana Veritabanı Tabloları

Ana veritabanı yapısını oluşturmak için şu dosyalar var (proje kök dizininde):

- **`supabase-first-user-admin.sql`** - İlk kullanıcıyı admin yapmak için
- **`supabase-remove-email-admin.sql`** - E-posta ile admin kaldırma

### 2. Site Ayarları Tablosu (Opsiyonel)

Site ayarları özelleştirmeleri için `site_settings` tablosu gereklidir:

```sql
-- Supabase SQL Editor'de çalıştırın:
```

**Dosya:** `supabase-schema-settings.sql`

#### Site Ayarları Tablosu Hakkında

- ✅ **Opsiyoneldir** - Bu tablo olmasa bile uygulama çalışır
- 🎨 **Tema Özelleştirme** - Admin panelinden renkleri değiştirebilirsiniz
- ⚙️ **Genel Ayarlar** - Site adı, logo, kategoriler vb.
- 🔐 **Güvenlik** - Kayıt olma, e-posta doğrulama ayarları

#### Tabloyu Oluşturma

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. `supabase-schema-settings.sql` dosyasının içeriğini yapıştırın
4. "Run" düğmesine tıklayın

### 3. Faturalar için Storage Bucket

Fatura görsellerini saklamak için bir bucket oluşturun:

1. Supabase Dashboard → Storage
2. "New bucket" tıklayın
3. Bucket adı: `invoices`
4. Public bucket olarak işaretleyin
5. "Create bucket" tıklayın

#### Storage Policies

```sql
-- Authenticated kullanıcılar yükleyebilir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Herkes okuyabilir (public bucket)
CREATE POLICY "Anyone can view invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Sadece kendi dosyalarını silebilir
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔧 Veritabanı Yapısı

### Ana Tablolar

#### `users`
Kullanıcı bilgileri ve yetkilendirme

```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- full_name (TEXT)
- is_admin (BOOLEAN, default: false)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `invoices`
Fatura kayıtları

```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- title (TEXT)
- amount (DECIMAL)
- type (TEXT) -- 'income' | 'expense'
- category (TEXT)
- date (DATE)
- image_url (TEXT)
- ocr_text (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `site_settings` (Opsiyonel)
Site konfigürasyonu

```sql
- id (UUID, PK)
- setting_key (TEXT, UNIQUE)
- setting_value (JSONB)
- setting_type (TEXT)
- description (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🚀 Hızlı Başlangıç

### Minimum Kurulum (Sadece Faturalar)

1. `.env.local` dosyasını oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Ana tabloları oluşturun (Supabase otomatik oluşturur veya migration çalıştırın)
3. İlk kullanıcıyı admin yapın (`supabase-first-user-admin.sql`)
4. Storage bucket'ı oluşturun (`invoices`)

### Tam Kurulum (Tüm Özellikler)

Yukarıdaki adımlara ek olarak:

5. `supabase-schema-settings.sql` dosyasını çalıştırın
6. Admin panelinden ayarları özelleştirin

## 🐛 Sorun Giderme

### "Settings fetch error" Hatası

Bu hata normal ve zararsızdır. Anlamı:
- `site_settings` tablosu henüz oluşturulmamış
- Uygulama otomatik olarak varsayılan ayarları kullanır
- Hiçbir özellik etkilenmez

**Çözüm:** 
- Görmezden gelin (uygulama çalışır)
- VEYA `supabase-schema-settings.sql` dosyasını çalıştırın

### Fatura Yükleme Hatası

- Storage bucket'ın `invoices` adında olduğunu kontrol edin
- Bucket'ın **public** olarak işaretlendiğini kontrol edin
- Storage policies'in doğru ayarlandığını kontrol edin

### Admin Paneline Erişememe

- İlk kullanıcıyı admin yapmayı unutmuş olabilirsiniz
- `supabase-first-user-admin.sql` dosyasını çalıştırın
- Veya manuel olarak users tablosunda `is_admin = true` yapın

## 📚 Daha Fazla Bilgi

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Önemli Notlar

1. **Güvenlik:** Production'da RLS (Row Level Security) politikalarını mutlaka aktif edin
2. **Backup:** Düzenli veritabanı yedekleri alın
3. **API Keys:** `.env.local` dosyasını asla git'e commitlemeyin
4. **Admin:** İlk admin kullanıcıyı oluşturduktan sonra, `supabase-first-user-admin.sql` scriptini silin veya yorum satırı yapın

