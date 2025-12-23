import { createWorker, PSM, OEM } from 'tesseract.js';

export interface OCRResult {
  text: string;
  amount: number | null;
  confidence: number;
  invoiceNumber?: string | null;
  date?: string | null;
  vendor?: string | null;
  detectedAmounts?: Array<{ value: number; matchText: string }>; // Birden fazla tutar tespit edildiyse
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

        // ÇOK GELİŞMİŞ İYİLEŞTİRME
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 1. Kontrast ve Parlaklık Artırma (daha agresif)
        const contrast = 1.5; // 1.2'den 1.5'e çıkarıldı
        const brightness = 15; // 10'dan 15'e çıkarıldı

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] * contrast + brightness));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrast + brightness));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrast + brightness));
        }

        // 2. Sharpening Filter (keskinleştirme)
        const sharpen = [
          0, -1, 0,
          -1, 5, -1,
          0, -1, 0
        ];
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
          ctx.putImageData(imageData, 0, 0);
        }

        // 3. Adaptive Threshold (metin netleştirme)
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 128;
          const newValue = gray > threshold ? 255 : 0;
          
          // Hafif threshold (çok sert olmasın)
          const mixFactor = 0.3; // %30 threshold, %70 orijinal
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

  const worker = await createWorker('tur+eng', OEM.LSTM_ONLY, {
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

  // Tesseract parametrelerini ayarla (UPGRADED - Daha iyi sayı tanıma)
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT, // AUTO yerine SPARSE_TEXT - faturalar için daha iyi
    tessedit_char_whitelist: '0123456789ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZabcçdefgğhıijklmnoöprsştuüvyz.,:-/₺TL$€£ ', // Tüm para birimleri eklendi
    preserve_interword_spaces: '1', // Kelime arası boşlukları koru
    tessedit_do_invert: '0', // Renk terslemesi yapma
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
  onProgress?: ProgressCallback
): Promise<OCRResult> => {
  try {
    // Görseli ön işle
    onProgress?.({ status: 'Görsel hazırlanıyor...', progress: 0 });
    const processedImage = await preprocessImage(imageFile);

    // Worker'ı al
    onProgress?.({ status: 'OCR motoru başlatılıyor...', progress: 0.1 });
    const worker = await getWorker(onProgress);

    // OCR işlemini gerçekleştir
    onProgress?.({ status: 'Metin tanınıyor...', progress: 0.3 });
    const {
      data: { text, confidence, words },
    } = await worker.recognize(processedImage);

    // Metni analiz et
    onProgress?.({ status: 'Fatura analiz ediliyor...', progress: 0.9 });
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
      detectedAmounts: allAmounts, // Tüm tespit edilen tutarları da gönder
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
  
  // DAHA GENİŞ PATTERN'LER - Daha fazla varyasyon
  const patterns = [
    // ÇOK YÜKSEK ÖNCELİK - Toplam varyasyonları (daha esnek regex)
    /(?:toplam|total|sum|genel\s*toplam|grand\s*total|son\s*toplam|nihai\s*toplam)[:\s-]*(?:tutar|fiyat|bedel|ücret|miktar|amount)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
    // ÇOK YÜKSEK ÖNCELİK - Ödenecek/Ödeme varyasyonları
    /(?:ödenecek|ödeme|payment|pay|odeme)[:\s-]*(?:tutar|tutarı|toplam|miktar|amount)?[:\s-]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2})\s*(?:tl|₺|try)?/gi,
    
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

