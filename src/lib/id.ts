/** توليد معرّفات فريدة تعمل في كل المتصفّحات. */
export const newId = (): string => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/** رقم مرجعي قصير يُعرض على الفواتير. */
export const shortRef = (id: string): string =>
  id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || '------';
