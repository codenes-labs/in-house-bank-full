const DEFAULT_BRAND_SVG_PATH = '/favicon.svg';

/**
 * Rasteriza um SVG para PNG (data URL) no navegador, para embed no pdf-lib.
 */
export async function rasterizeSvgToPngDataUrl(
  svgUrl: string = DEFAULT_BRAND_SVG_PATH,
  sizePx = 128,
): Promise<string | undefined> {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const response = await fetch(svgUrl);
  if (!response.ok) {
    return undefined;
  }
  const svgText = await response.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }
    context.drawImage(image, 0, 0, sizePx, sizePx);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('svg load failed'));
    image.src = src;
  });
}
