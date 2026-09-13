/**
 * Crop helpers shared by every photo upload.
 *
 * The crop shape mirrors how the photo is displayed on the landing page or
 * admin cards, so what the admin sees in the cropper is what visitors get.
 */

export type CropShape = 'square' | 'round' | 'landscape' | 'banner'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export const CROP_SHAPES: Record<CropShape, { aspect: number; round: boolean }> = {
  /** Student photos, logo, principal and story photos, artwork (rounded-2xl tiles) */
  square: { aspect: 1, round: false },
  /** Team members and testimonial avatars (rounded-full) */
  round: { aspect: 1, round: true },
  /** Gallery cards (w-72 h-52 on the landing carousel) */
  landscape: { aspect: 4 / 3, round: false },
  /** Announcement banners (wide h-36 strip on the card) */
  banner: { aspect: 16 / 9, round: false },
}

/** Output size for a crop: never upscales, caps the longest side at maxSize. */
export function cropOutputSize(
  crop: { width: number; height: number },
  maxSize: number
): { width: number; height: number } {
  const longest = Math.max(crop.width, crop.height)
  const scale = longest > maxSize ? maxSize / longest : 1
  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  }
}

/** Swaps the extension for .jpg since the cropper always emits JPEG. */
export function cropFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  return `${base || 'photo'}.jpg`
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for cropping'))
    }
    img.src = url
  })
}

/**
 * Cuts the given pixel area out of the file and returns it as a JPEG File.
 * Quality is kept high here; callers still run compressImage() for the final
 * upload size, so this step should not be the lossy one.
 */
export async function cropImageFile(
  file: File,
  crop: CropArea,
  { maxSize = 1600, quality = 0.92 }: { maxSize?: number; quality?: number } = {}
): Promise<File> {
  const img = await loadImage(file)
  const out = cropOutputSize(crop, maxSize)

  const canvas = document.createElement('canvas')
  canvas.width = out.width
  canvas.height = out.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  // Fill white first so transparent PNGs do not turn black in JPEG
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, out.width, out.height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Image crop failed')

  return new File([blob], cropFileName(file.name), { type: 'image/jpeg' })
}
