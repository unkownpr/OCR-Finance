import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

type ProgressCallback = (progress: OCRProgress) => void;

// Worker'ı yeniden kullanmak için cache
let cachedWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

/**
 * Tesseract Worker'ı başlat (Standart Konfigürasyon)
 */
const getWorker = async (onProgress?: ProgressCallback) => {
  if (cachedWorker) {
    return cachedWorker;
  }

  // Standart Tesseract.js - Türkçe dil desteği
  const worker = await createWorker('tur', 1, {
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
 * Fatura görselini OCR ile işle (Standart Tesseract.js)
 */
export const processInvoiceWithOCR = async (
  imageFile: File,
  onProgress?: ProgressCallback
): Promise<OCRResult> => {
  try {
    // Worker'ı al
    onProgress?.({ status: 'OCR motoru başlatılıyor...', progress: 0.1 });
    const worker = await getWorker(onProgress);

    // OCR işlemini gerçekleştir
    onProgress?.({ status: 'Metin tanınıyor...', progress: 0.3 });
    
    // File'ı URL'e çevir
    const imageUrl = URL.createObjectURL(imageFile);
    
    const {
      data: { text, confidence },
    } = await worker.recognize(imageUrl);

    // URL'i temizle
    URL.revokeObjectURL(imageUrl);

    console.log('📝 Tesseract OCR tamamlandı, metin uzunluğu:', text.length);

    onProgress?.({ status: 'Tamamlandı!', progress: 1 });

    return {
      text,
      confidence,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('OCR işlemi başarısız oldu');
  }
};
