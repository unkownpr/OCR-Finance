/**
 * Google Gemini API entegrasyonu
 * Fatura görsellerini direkt AI ile analiz et ve field extraction yap
 */

export interface GeminiInvoiceData {
  amount: number | null;
  invoiceNumber: string | null;
  date: string | null;
  vendor: string | null;
  category: string | null;
  confidence: number;
  rawExtraction: string; // Gemini'nin ham yanıtı
}

/**
 * Gemini API ile fatura verilerini çıkar
 * @param ocrText Tesseract.js'den gelen ham OCR metni
 * @param apiKey Gemini API anahtarı
 * @param model Gemini model adı (default: gemini-2.0-flash-exp)
 */
export const extractInvoiceDataWithGemini = async (
  ocrText: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<GeminiInvoiceData> => {
  if (!apiKey || !ocrText) {
    throw new Error('API key ve OCR metni gerekli');
  }

  try {
    const prompt = `Sen bir fatura analiz uzmanısın. Aşağıdaki OCR metninden fatura bilgilerini çıkar.

OCR METNİ:
${ocrText}

GÖREV:
1. TUTAR: En büyük tutarı bul (TOPLAM, K.KART, NAKİT vb. ile işaretlenmiş)
   - Türk Lirası formatı: 1.850,53 veya 1850.53
   - OCR hataları düzelt (O→0, l→1, virgül/nokta karışımı)
   - Sonucu sayıya çevir (örn: 1850.53)

2. FATURA NO: Fatura numarası, belge no, fiş no vb.
   - Genellikle "NO:", "FIŞ NO:", "BELGE NO:" ile başlar
   - Örnek: "276850-5", "123456"

3. TARİH: Fatura tarihi
   - Format: DD/MM/YYYY veya DD.MM.YYYY
   - Örnek: "28/07/2023" veya "28.07.2023"

4. SATICI: Firma adı, mağaza adı
   - İlk 2-3 satırdaki firma bilgisi
   - Örnek: "HIRFANLI PETROL A.S."

ÖNEMLİ:
- Eğer bir bilgi bulunamazsa null döndür
- Tutarları MUTLAKA sayı formatına çevir (nokta ayraç olarak)
- OCR hatalarını düzelt (örn: "11.85O,53" → 11850.53)

JSON formatında yanıt ver (sadece JSON, açıklama yok):
{
  "amount": 1850.53,
  "invoiceNumber": "276850-5",
  "date": "28/07/2023",
  "vendor": "HIRFANLI PETROL A.S.",
  "confidence": 0.95
}`;

    // Gemini API'ye istek at (yeni format - header ile)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey, // Yeni format - header'da key
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Düşük temperature = daha tutarlı sonuçlar
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API hatası:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('🤖 Gemini AI yanıtı:', generatedText);

    // JSON çıktısını parse et
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Gemini JSON döndürmedi, fallback kullanılıyor');
      return {
        amount: null,
        invoiceNumber: null,
        date: null,
        vendor: null,
        confidence: 0,
        rawExtraction: generatedText,
      };
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      amount: extractedData.amount || null,
      invoiceNumber: extractedData.invoiceNumber || null,
      date: extractedData.date || null,
      vendor: extractedData.vendor || null,
      confidence: extractedData.confidence || 0.5,
      rawExtraction: generatedText,
    };
  } catch (error) {
    console.error('❌ Gemini AI hatası:', error);
    throw error;
  }
};

/**
 * Gemini Vision API ile fatura görselini direkt analiz et
 * @param imageFile Fatura görseli (File objesi)
 * @param apiKey Gemini API anahtarı
 * @param model Gemini model adı (default: gemini-2.0-flash-exp)
 */
export const analyzeInvoiceImageWithGemini = async (
  imageFile: File,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<GeminiInvoiceData> => {
  if (!apiKey || !imageFile) {
    throw new Error('API key ve görsel gerekli');
  }

  try {
    // Görseli base64'e çevir
    const base64Image = await fileToBase64(imageFile);
    const base64Data = base64Image.split(',')[1]; // "data:image/jpeg;base64," kısmını kaldır

    const prompt = `Sen bir fatura analiz uzmanısın. Bu fatura görselini analiz et ve bilgileri çıkar.

GÖREV:
1. TUTAR: Faturadaki toplam tutarı bul (TOPLAM, K.KART, NAKİT, NET, BRÜT vb. ile işaretlenmiş en yüksek tutar)
   - Türk Lirası formatında: 1.850,53 veya 1850.53
   - Sonucu sayıya çevir (örn: 1850.53)

2. FATURA NO: Fatura numarası, belge no, fiş no vb.
   - Genellikle "NO:", "FIŞ NO:", "BELGE NO:" ile başlar
   - Örnek: "276850-5", "123456"

3. TARİH: Fatura tarihi
   - Format: DD/MM/YYYY veya DD.MM.YYYY
   - Örnek: "28/07/2023" veya "28.07.2023"

4. SATICI: Firma adı, mağaza adı
   - Faturanın üst kısmındaki firma bilgisi
   - Örnek: "HIRFANLI PETROL A.S."

5. KATEGORİ: Fatura kategorisi (tahmin et)
   - Seçenekler: Yemek, Ulaşım, Faturalar, Alışveriş, Eğlence, Sağlık, Eğitim, Kira, Diğer
   - Firma adına ve içeriğine göre en uygun kategoriyi seç

ÖNEMLİ:
- Eğer bir bilgi bulunamazsa null döndür
- Tutarları MUTLAKA sayı formatına çevir (nokta ayraç olarak)
- Türkçe karakterleri koru

JSON formatında yanıt ver (sadece JSON, açıklama yok):
{
  "amount": 1850.53,
  "invoiceNumber": "276850-5",
  "date": "28/07/2023",
  "vendor": "HIRFANLI PETROL A.S.",
  "category": "Ulaşım",
  "confidence": 0.95
}`;

    // Gemini Vision API'ye istek at
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini Vision API hatası:', errorData);
      throw new Error(`Gemini Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('🤖 Gemini Vision AI yanıtı:', generatedText);

    // JSON çıktısını parse et
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Gemini JSON döndürmedi');
      return {
        amount: null,
        invoiceNumber: null,
        date: null,
        vendor: null,
        category: null,
        confidence: 0,
        rawExtraction: generatedText,
      };
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      amount: extractedData.amount || null,
      invoiceNumber: extractedData.invoiceNumber || null,
      date: extractedData.date || null,
      vendor: extractedData.vendor || null,
      category: extractedData.category || null,
      confidence: extractedData.confidence || 0.5,
      rawExtraction: generatedText,
    };
  } catch (error) {
    console.error('❌ Gemini Vision AI hatası:', error);
    throw error;
  }
};

/**
 * File'ı base64'e çevir
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gemini API key'in geçerli olup olmadığını test et
 */
export const testGeminiApiKey = async (
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Test',
                },
              ],
            },
          ],
        }),
      }
    );

    return response.ok;
  } catch {
    return false;
  }
};

