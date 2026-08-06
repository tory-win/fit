import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

/** 기기에 저장한 이미지를 화면에 붙일 수 있는 URL 로 바꾼다. */
export async function deviceImageUrl(path: string): Promise<string> {
  if (Capacitor.getPlatform() !== 'web') {
    try {
      const { uri } = await Filesystem.getUri({ path, directory: Directory.Data })
      return Capacitor.convertFileSrc(uri)
    } catch {
      // 웹뷰가 파일 URI 를 못 읽으면 아래 base64 경로로 떨어진다.
    }
  }

  const result = await Filesystem.readFile({ path, directory: Directory.Data })
  if (typeof result.data === 'string') {
    return `data:image/jpeg;base64,${result.data}`
  }
  return URL.createObjectURL(result.data)
}

/** 생성 요청처럼 원본 바이트가 필요한 곳에서만 쓴다. */
export async function readDeviceImageBase64(path: string): Promise<string> {
  const result = await Filesystem.readFile({ path, directory: Directory.Data })
  if (typeof result.data === 'string') return result.data

  const buffer = await result.data.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

export async function deleteDeviceFile(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path, directory: Directory.Data })
  } catch {
    // 이미 없는 파일은 원하는 상태다.
  }
}
