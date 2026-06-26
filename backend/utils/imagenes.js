const DATA_IMAGE_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/;
const DEFAULT_MIME = 'image/jpeg';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function normalizarBase64Imagen(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const match = trimmed.match(DATA_IMAGE_REGEX);
  const mimeType = match?.[1] || DEFAULT_MIME;
  const base64 = match ? trimmed.replace(DATA_IMAGE_REGEX, '') : trimmed;
  return { base64, mimeType };
}

function imagenBase64ABuffer(input) {
  const normalizada = normalizarBase64Imagen(input);
  if (!normalizada?.base64) return null;

  const buffer = Buffer.from(normalizada.base64, 'base64');
  if (!buffer.length) return null;
  if (buffer.length > MAX_IMAGE_BYTES) {
    const error = new Error('Cada imagen debe pesar como máximo 2MB luego de comprimirla.');
    error.status = 413;
    throw error;
  }

  return {
    buffer,
    mimeType: normalizada.mimeType,
  };
}

function bufferImagenABase64(buffer) {
  if (!buffer) return null;
  return Buffer.from(buffer).toString('base64');
}

function fotoARespuesta(foto) {
  if (!foto?.foto) return null;
  return {
    id: foto.identificador,
    mimeType: DEFAULT_MIME,
    foto: bufferImagenABase64(foto.foto),
  };
}

module.exports = {
  DEFAULT_MIME,
  MAX_IMAGE_BYTES,
  normalizarBase64Imagen,
  imagenBase64ABuffer,
  bufferImagenABase64,
  fotoARespuesta,
};
