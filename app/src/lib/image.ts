export const CLOSET_IMAGE_MAX_EDGE = 1600
export const CLOSET_IMAGE_QUALITY = 0.82

export interface PreparedImage {
  base64: string
  dataUrl: string
  width: number
  height: number
  /** 여백을 잘라냈는지 — 확인 화면에서 원본으로 되돌릴 수 있게 */
  trimmed?: boolean
  original?: { base64: string; dataUrl: string }
}

/** 가장자리 표본으로 배경색을 추정해 테두리 여백을 잘라낸다 — M8-기획.md §3.1 */
export const TRIM_MIN_AREA_RATIO = 0.25
export const TRIM_TOLERANCE = 26
export const TRIM_PADDING_RATIO = 0.05

export interface TrimBox {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * 배경으로 보이는 테두리를 걷어낸 사각형을 돌려준다.
 * 남는 영역이 원본의 25% 미만이면 `null` — 잘못 잡은 것으로 보고 자르지 않는다.
 */
export function findContentBox(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = TRIM_TOLERANCE,
): TrimBox | null {
  if (width < 8 || height < 8) return null

  const at = (x: number, y: number) => (y * width + x) * 4
  const corners = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
  ] as const
  let br = 0
  let bg = 0
  let bb = 0
  for (const [x, y] of corners) {
    const index = at(x, y)
    br += data[index]
    bg += data[index + 1]
    bb += data[index + 2]
  }
  br /= corners.length
  bg /= corners.length
  bb /= corners.length

  const isContent = (x: number, y: number) => {
    const index = at(x, y)
    return Math.abs(data[index] - br) + Math.abs(data[index + 1] - bg) + Math.abs(data[index + 2] - bb) > tolerance
  }

  let left = width
  let top = height
  let right = -1
  let bottom = -1
  // 2픽셀 간격 표본이면 충분하고 큰 사진에서도 빠르다.
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (!isContent(x, y)) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }

  if (right <= left || bottom <= top) return null

  const padX = Math.round(width * TRIM_PADDING_RATIO)
  const padY = Math.round(height * TRIM_PADDING_RATIO)
  const box = {
    left: Math.max(0, left - padX),
    top: Math.max(0, top - padY),
    right: Math.min(width - 1, right + padX),
    bottom: Math.min(height - 1, bottom + padY),
  }

  const area = (box.right - box.left) * (box.bottom - box.top)
  if (area < width * height * TRIM_MIN_AREA_RATIO) return null
  if (area >= width * height * 0.96) return null // 잘라낼 게 거의 없으면 그대로 둔다

  return box
}

export function calculateTargetSize(
  width: number,
  height: number,
  maxEdge = CLOSET_IMAGE_MAX_EDGE,
): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxEdge <= 0) {
    throw new Error('유효하지 않은 이미지 크기예요.')
  }

  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function stripDataUrlPrefix(value: string): string {
  const comma = value.indexOf(',')
  return value.startsWith('data:') && comma >= 0 ? value.slice(comma + 1) : value
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('사진을 불러오지 못했어요. 다른 사진을 선택해 주세요.'))
    image.src = source
  })
}

/**
 * Decoding into a canvas and exporting a new JPEG deliberately drops the source
 * filename and all EXIF blocks, including GPS. Only this returned payload may be
 * written to the closet store.
 */
export async function prepareClosetImage(
  source: string,
  { trim = false }: { trim?: boolean } = {},
): Promise<PreparedImage> {
  const image = await loadImage(source)
  const target = calculateTargetSize(image.naturalWidth, image.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = target.width
  canvas.height = target.height

  const context = canvas.getContext('2d', { alpha: false })
  if (!context) {
    throw new Error('사진을 안전하게 변환하지 못했어요.')
  }

  context.fillStyle = '#f7f2e9'
  context.fillRect(0, 0, target.width, target.height)
  context.drawImage(image, 0, 0, target.width, target.height)

  const dataUrl = canvas.toDataURL('image/jpeg', CLOSET_IMAGE_QUALITY)
  const prepared: PreparedImage = {
    base64: stripDataUrlPrefix(dataUrl),
    dataUrl,
    width: target.width,
    height: target.height,
  }
  if (!trim) return prepared

  try {
    const pixels = context.getImageData(0, 0, target.width, target.height)
    const box = findContentBox(pixels.data, target.width, target.height)
    if (!box) return prepared

    const cropped = document.createElement('canvas')
    cropped.width = box.right - box.left
    cropped.height = box.bottom - box.top
    const cropContext = cropped.getContext('2d', { alpha: false })
    if (!cropContext) return prepared

    cropContext.drawImage(
      canvas,
      box.left, box.top, cropped.width, cropped.height,
      0, 0, cropped.width, cropped.height,
    )
    const trimmedUrl = cropped.toDataURL('image/jpeg', CLOSET_IMAGE_QUALITY)

    return {
      base64: stripDataUrlPrefix(trimmedUrl),
      dataUrl: trimmedUrl,
      width: cropped.width,
      height: cropped.height,
      trimmed: true,
      original: { base64: prepared.base64, dataUrl: prepared.dataUrl },
    }
  } catch {
    // 캔버스를 읽지 못하면 원본을 그대로 쓴다.
    return prepared
  }
}
