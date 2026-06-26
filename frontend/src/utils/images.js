export const dataUriFromBase64 = (base64, mimeType = 'image/jpeg') => {
  if (!base64) return null;
  const texto = String(base64);
  if (texto.startsWith('data:image/')) return texto;
  return `data:${mimeType};base64,${texto}`;
};

export const imageSourceFromBase64 = (base64, mimeType = 'image/jpeg') => {
  const uri = dataUriFromBase64(base64, mimeType);
  return uri ? { uri } : null;
};

export const normalizePickedImage = (asset) => ({
  uri: asset?.uri,
  base64: asset?.base64 || null,
  mimeType: asset?.mimeType || asset?.type || 'image/jpeg',
  fileSize: asset?.fileSize || asset?.filesize || null,
  width: asset?.width || null,
  height: asset?.height || null,
});

export const imagePayloadFromPicked = (image) => ({
  base64: image?.base64,
  mimeType: image?.mimeType || 'image/jpeg',
});
