/*
Intro: images es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en utils/images.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/export // Explica: define dataUriFromBase64 para usarlo en este archivo.
const dataUriFromBase64 = (base64, mimeType = 'image/jpeg') => {// Control: evalua una condicion para decidir el siguiente paso.
  if (!base64) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return null; // Explica: define texto usando el resultado de String.
  const texto = String(base64); // Control: evalua una condicion para decidir el siguiente paso.
  if (texto.startsWith('data:image/')) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return texto; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return `data:${mimeType};base64,${texto}`;};export // Explica: define imageSourceFromBase64 para usarlo en este archivo.
const imageSourceFromBase64 = (base64, mimeType = 'image/jpeg') => {// Explica: define uri usando el resultado de dataUriFromBase64.
  const uri = dataUriFromBase64(base64, mimeType); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return uri ? { uri } : null;};export // Explica: define normalizePickedImage para usarlo en este archivo.
const normalizePickedImage = (asset) => ({ uri: asset?.uri, base64: asset?.base64 || null, mimeType: asset?.mimeType || asset?.type || 'image/jpeg', fileSize: asset?.fileSize || asset?.filesize || null, width: asset?.width || null,
  height: asset?.height || null
});

export // Explica: define imagePayloadFromPicked para usarlo en este archivo.
const imagePayloadFromPicked = (image) => ({ base64: image?.base64,
  mimeType: image?.mimeType || 'image/jpeg'
});
