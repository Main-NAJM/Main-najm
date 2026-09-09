/**
 * ضغط صور الأعمال قبل حفظها.
 *
 * الصور تُخزَّن داخل الوثيقة نفسها (data URL) لا في Firebase Storage، فحدّ وثيقة
 * Firestore مليون بايت هو السقف الفعلي — لذلك تُصغَّر الصورة وتُخفَّض جودتها حتى
 * تنزل تحت الحدّ الآمن، وإلا رُفضت برسالة واضحة.
 */

const MAX_EDGE = 1280;
const SAFE_BYTES = 700 * 1024; // هامش تحت حدّ الوثيقة (١ مليون بايت)
const QUALITY_STEPS = [0.72, 0.6, 0.5, 0.4];

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذّرت قراءة الصورة.'));
    };
    image.src = url;
  });

/** حجم data URL بالبايت تقريباً (base64 يزيد الحجم الثلث). */
const byteSize = (dataUrl: string): number => Math.ceil((dataUrl.length - 22) * 0.75);

export const compressImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('اختر ملف صورة.');

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذّرت معالجة الصورة في هذا المتصفّح.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (byteSize(dataUrl) <= SAFE_BYTES) return dataUrl;
  }

  throw new Error('الصورة كبيرة جداً حتى بعد الضغط — جرّب صورة أصغر.');
};
