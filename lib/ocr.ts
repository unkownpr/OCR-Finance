import { createWorker, PSM, OEM } from 'tesseract.js';
import { extractInvoiceDataWithGemini } from './gemini';

export interface OCRResult {
  text: string;
  amount: number | null;
  confidence: number;
  invoiceNumber?: string | null;
  date?: string | null;
  vendor?: string | null;
  detectedAmounts?: Array<{ value: number; matchText: string }>; // Birden fazla tutar tespit edildiyse
  geminiEnhanced?: boolean; // Gemini AI tarafından zenginleştirildi mi?
}

export interface OCRProgress {
  status: string;
  progress: number;
}

type ProgressCallback = (progress: OCRProgress) => void;

// Worker'ı yeniden kullanmak için cache
let cachedWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

/**
 * Görsel ön işleme - OCR kalitesini artırır (UPGRADED)
 */
const preprocessImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context alınamadı'));
          return;
        }

        // Boyutlandırma - Daha yüksek çözünürlük (OCR için daha iyi)
        let width = img.width;
        let height = img.height;
        const maxSize = 3000; // 2000'den 3000'e çıkarıldı
        const minSize = 1200; // Minimum boyut eklendi

        // Çok küçükse büyüt
        if (width < minSize && height < minSize) {
          const scale = minSize / Math.max(width, height);
          width *= scale;
          height *= scale;
        }

        // Çok büyükse küçült
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Görseli çiz
        ctx.drawImage(img, 0, 0, width, height);

        // ULTRA GELİŞMİŞ İYİLEŞTİRME (Petrol faturası formatı için)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 1. ÇOK AGRESIF Kontrast ve Parlaklık (soluk faturalar için)
        const contrast = 2.0; // Daha da artırıldı
        const brightness = 25; // Daha parlak

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] * contrast + brightness));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrast + brightness));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrast + brightness));
        }

        // 2. Güçlü Sharpening (kesin keskinleştirme)
        const tempData = new Uint8ClampedArray(data);
        const sharpenKernel = [
          0, -1, 0,
          -1, 6, -1, // Merkez 6 (daha güçlü)
          0, -1, 0
        ];
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                  const kernelIdx = (ky + 1) * 3 + (kx + 1);
                  sum += tempData[idx] * sharpenKernel[kernelIdx];
                }
              }
              const idx = (y * width + x) * 4 + c;
              data[idx] = Math.min(255, Math.max(0, sum));
            }
          }
        }

        // 3. Daha Güçlü Adaptive Threshold
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 140; // Biraz yükseltildi
          const newValue = gray > threshold ? 255 : 0;
          
          // Daha güçlü threshold
          const mixFactor = 0.5; // %50 threshold, %50 orijinal
          data[i] = data[i] * (1 - mixFactor) + newValue * mixFactor;
          data[i + 1] = data[i + 1] * (1 - mixFactor) + newValue * mixFactor;
          data[i + 2] = data[i + 2] * (1 - mixFactor) + newValue * mixFactor;
        }

        ctx.putImageData(imageData, 0, 0);

        // Data URL olarak döndür
        resolve(canvas.toDataURL('image/png', 1.0)); // Max kalite
      };
      img.onerror = () => reject(new Error('Görsel yüklenemedi'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(file);
  });
};

/**
 * Tesseract Worker'ı başlat ve yapılandır
 */
const getWorker = async (onProgress?: ProgressCallback) => {
  if (cachedWorker) {
    return cachedWorker;
  }

  // TÜRKÇE ÖNCE - Türkiye faturaları için optimize
  const worker = await createWorker('tur', OEM.LSTM_ONLY, {
    logger: (m) => {
      console.log(m);
      if (onProgress && m.status) {
        onProgress({
          status: m.status,
          progress: m.progress || 0,
        });
      }
    },
  });

  // Tesseract parametrelerini ayarla (ULTRA OPTIMIZED - Türkiye faturaları için)
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    // Türkçe karakterler + sayılar + noktalama
    tessedit_char_whitelist: '0123456789ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZabcçdefgğhıijklmnoöprsştuüvyz.,:-/()₺TL*%XxLtLT ', 
    preserve_interword_spaces: '1',
    tessedit_do_invert: '0',
    // Ek parametreler - sayı tanımayı iyileştir
    classify_bln_numeric_mode: '1', // Sayı tanımayı optimize et
    tessedit_char_blacklist: '', // Hiçbir karakteri kara listeye alma
  });

  cachedWorker = worker;
  return worker;
};

/**
 * Worker'ı temizle - memory leak önleme
 */
export const terminateOCRWorker = async () => {
  if (cachedWorker) {
    await cachedWorker.terminate();
    cachedWorker = null;
  }
};

/**
 * Fatura görselini işle ve metni çıkar
 */
export const processInvoice = async (
  imageFile: File,
  onProgress?: ProgressCallback,
  geminiApiKey?: string,
  geminiModel?: string
): Promise<OCRResult> => {
  try {
    // Görseli ön işle
    onProgress?.({ status: 'Görsel hazırlanıyor...', progress: 0 });
    const processedImage = await preprocessImage(imageFile);

    // Worker'ı al
    onProgress?.({ status: 'OCR motoru başlatılıyor...', progress: 0.1 });
    const worker = await getWorker(onProgress);

    // OCR işlemini gerçekleştir
    onProgress?.({ status: 'Metin tanınıyor (Tesseract.js)...', progress: 0.3 });
    const {
      data: { text, confidence, words },
    } = await worker.recognize(processedImage);

    console.log('📝 Tesseract OCR tamamlandı, metin uzunluğu:', text.length);

    // Gemini API varsa, AI ile zenginleştir
    if (geminiApiKey && text) {
      try {
        onProgress?.({ status: 'AI ile analiz ediliyor (Gemini)...', progress: 0.7 });
        const geminiData = await extractInvoiceDataWithGemini(
          text,
          geminiApiKey,
          geminiModel || 'gemini-2.0-flash-exp'
        );

        console.log('🤖 Gemini AI sonuçları:', geminiData);

        // Gemini'nin sonuçlarını kullan (daha doğru)
        onProgress?.({ status: 'Tamamlandı! (AI ile zenginleştirildi)', progress: 1 });

        return {
          text,
          amount: geminiData.amount,
          confidence: Math.max(confidence, geminiData.confidence * 100), // Gemini güveni %0-1, Tesseract %0-100
          invoiceNumber: geminiData.invoiceNumber,
          date: geminiData.date,
          vendor: geminiData.vendor,
          detectedAmounts: [], // Gemini tek tutar döndürüyor
          geminiEnhanced: true,
        };
      } catch (geminiError) {
        console.warn('⚠️ Gemini AI hatası, Tesseract sonuçları kullanılıyor:', geminiError);
        // Gemini başarısız olursa, Tesseract sonuçlarına fallback
      }
    }

    // Gemini yoksa veya hata verdiyse, Tesseract analiz sonuçlarını kullan
    onProgress?.({ status: 'Fatura analiz ediliyor (Tesseract)...', progress: 0.9 });
    const { selectedAmount, allAmounts } = extractAmount(text);
    const invoiceNumber = extractInvoiceNumber(text);
    const date = extractDate(text);
    const vendor = extractVendor(text);

    onProgress?.({ status: 'Tamamlandı!', progress: 1 });

    return {
      text,
      amount: selectedAmount,
      confidence,
      invoiceNumber,
      date,
      vendor,
      detectedAmounts: allAmounts,
      geminiEnhanced: false,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Fatura işlenirken bir hata oluştu');
  }
};

/**
 * Metinden para miktarını çıkar - ULTRA GELİŞMİŞ Algoritma
 */
const extractAmount = (text: string): { selectedAmount: number | null; allAmounts: Array<{ value: number; matchText: string }> } => {
  // Metni normalize et - çoklu boşlukları ve satır sonlarını temizle
  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();
  
  // TÜRKİYE FATURA FORMATLARI İÇİN ÖZEL PATTERN'LER
  const patterns = [
    // EN YÜKSEK ÖNCELİK - Kredi Kartı Ödemeleri (K.KART, KART)
    /(?:k\.?kart|k\.?k|kart|kredi\s*kart)[:\s-]*(?:\*)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // ÇOK YÜKSEK ÖNCELİK - TOPLAM varyasyonları
    /(?:toplam|total|sum|genel\s*toplam|grand\s*total|son\s*toplam)[:\s-]*(?:\*)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // ÇOK YÜKSEK ÖNCELİK - Nakit/Ödeme varyasyonları
    /(?:nakit|nakıt|odenen|ödenecek|ödeme|ödenen|payment|pay)[:\s-]*(?:\*)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // ÇOK YÜKSEK ÖNCELİK - Net/Brüt toplamlar
    /(?:net|brüt|brut|gross|nett)[:\s-]*(?:toplam|tutar|total)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // YÜKSEK ÖNCELİK - Satış varyasyonları
    /(?:satış|satiş|satıs|satis|sale|sales)[:\s-]*(?:tutarı|tutari|bedeli|bedel|fiyatı|fiyat|price|amount)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // YÜKSEK ÖNCELİK - Fatura varyasyonları
    /(?:fatura|invoice|fiş|fis|makbuz|receipt)[:\s-]*(?:tutarı|tutari|toplam|total|amount)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // YÜKSEK ÖNCELİK - KDV dahil varyasyonları
    /(?:kdv|vergi|vat|tax)[:\s-]*(?:dahil|dâhil|dahilmi|included)[:\s-]*(?:toplam|tutar)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // ORTA ÖNCELİK - Genel tutar/bedel/fiyat ifadeleri
    /(?:tutar|tutarı|tutari|bedel|bedeli|fiyat|fiyatı|fiyati|miktar|miktarı|miktari|amount|price)[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // DÜŞÜK ÖNCELİK - TL/₺/TRY ile biten sayılar (büyük formatlar)
    /([0-9]{1,3}(?:[.,\s][0-9]{3})+[.,][0-9]{2})\s*(?:tl|₺|try)/gi,
    
    // ÇOK DÜŞÜK ÖNCELİK - TL/₺/TRY ile biten basit sayılar
    /([0-9]+[.,][0-9]{2})\s*(?:tl|₺|try)/gi,
    
    // DÜŞÜK ÖNCELİK - Yıldız (*) ile başlayan tutarlar (Türkiye faturalarında yaygın)
    /\*\s*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // ALTERNATİF - Sadece büyük sayılar (5+ basamak)
    /([0-9]{1,3}[.,][0-9]{3}[.,][0-9]{2})/gi,
  ];

  const amounts: Array<{ value: number; priority: number; matchText: string; rawStr: string }> = [];

  patterns.forEach((pattern, index) => {
    const matches = normalizedText.matchAll(pattern);
    const priority = patterns.length - index;

    for (const match of matches) {
      let amountStr = match[1];
      const matchText = match[0];
      const rawStr = amountStr; // Orijinal string'i sakla
      
      // BOŞLUKLARI TEMİZLE (OCR bazen binlik ayraçlara boşluk koyar)
      amountStr = amountStr.replace(/\s/g, '');
      
      // AKILLI FORMAT ALGILA
      let value = 0;
      
      // Format tespiti - kaç nokta/virgül var?
      const dotCount = (amountStr.match(/\./g) || []).length;
      const commaCount = (amountStr.match(/,/g) || []).length;
      
      // Türkçe format: 11.850,53 (nokta binlik, virgül ondalık)
      if (dotCount >= 1 && commaCount === 1 && amountStr.lastIndexOf(',') > amountStr.lastIndexOf('.')) {
        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      }
      // İngilizce format: 11,850.53 (virgül binlik, nokta ondalık)
      else if (commaCount >= 1 && dotCount === 1 && amountStr.lastIndexOf('.') > amountStr.lastIndexOf(',')) {
        amountStr = amountStr.replace(/,/g, '');
      }
      // Sadece virgül var: 11850,53
      else if (commaCount === 1 && dotCount === 0) {
        amountStr = amountStr.replace(',', '.');
      }
      // Sadece nokta var: 11850.53
      else if (dotCount === 1 && commaCount === 0) {
        // Zaten doğru format
      }
      // Çoklu virgül: 11,850,53 -> yanlış okuma, virgülü binlik say
      else if (commaCount > 1) {
        amountStr = amountStr.replace(/,/g, '');
      }
      // Çoklu nokta: 11.850.53 -> yanlış okuma, noktayı binlik say
      else if (dotCount > 1) {
        const lastDot = amountStr.lastIndexOf('.');
        amountStr = amountStr.substring(0, lastDot).replace(/\./g, '') + '.' + amountStr.substring(lastDot + 1);
      }
      
      value = parseFloat(amountStr);
      
      // Makul bir fiyat aralığında olmalı (0.01 - 10,000,000 TL)
      if (!isNaN(value) && value > 0.01 && value <= 10000000) {
        amounts.push({ value, priority, matchText, rawStr });
      }
    }
  });

  if (amounts.length === 0) {
    return { selectedAmount: null, allAmounts: [] };
  }

  // Debug için konsola yaz
  console.log('🔍 Tespit edilen tutarlar:', amounts.map(a => ({
    değer: a.value,
    öncelik: a.priority,
    eşleşme: a.matchText,
    ham: a.rawStr
  })));

  // En yüksek önceliğe sahip olanı seç
  amounts.sort((a, b) => {
    // Önce önceliğe göre sırala
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Aynı öncelikteyse en büyük tutarı seç
    return b.value - a.value;
  });

  console.log('✅ Seçilen tutar:', amounts[0].value.toFixed(2), 'TL - Eşleşme:', amounts[0].matchText);

  return {
    selectedAmount: amounts[0].value,
    allAmounts: amounts.slice(0, 5).map(a => ({ value: a.value, matchText: a.matchText })) // İlk 5 tutar
  };
};

/**
 * Fatura numarasını çıkar
 */
const extractInvoiceNumber = (text: string): string | null => {
  const patterns = [
    /(?:fatura\s*no|invoice\s*no|belge\s*no|fiş\s*no)[:\s]*([A-Z0-9]+)/gi,
    /(?:no)[:\s]*([A-Z]{2,}[0-9]+)/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

/**
 * Tarih bilgisini çıkar
 */
const extractDate = (text: string): string | null => {
  const patterns = [
    // DD.MM.YYYY veya DD/MM/YYYY
    /(\d{2}[./]\d{2}[./]\d{4})/g,
    // DD-MM-YYYY
    /(\d{2}-\d{2}-\d{4})/g,
    // Tarih: veya Date: ile başlayanlar
    /(?:tarih|date)[:\s]*(\d{2}[./]\d{2}[./]\d{4})/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

/**
 * Satıcı/Firma adını çıkar
 */
const extractVendor = (text: string): string | null => {
  // Genellikle ilk satırlarda firma adı bulunur
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  
  if (lines.length > 0) {
    // İlk 3 satırdan en uzun olanı al (genellikle firma adı)
    const topLines = lines.slice(0, 3);
    const longestLine = topLines.reduce((a, b) => (a.length > b.length ? a : b));
    
    // Çok kısa veya çok uzunsa alma
    if (longestLine.length > 5 && longestLine.length < 100) {
      return longestLine.trim();
    }
  }

  return null;
};

