import { config } from "./env"

/**
 * Generates a public URL for a given key in the user S3 bucket.
 */
export const getPublicUrl = (key: string): string => {
  return `https://s3.${config.awsS3Region}.amazonaws.com/${config.awsS3BucketName}/${key}`
}

/**
 * Given a file name and a MIME type, returns a new file name with a file
 * extension based on the MIME type. For example, if the MIME type is
 * "image/jpeg", it will return "fileName.jpg".
 */
export const getFileNameWithFileType = (
  fileName: string,
  fileType: string
): string => {
  const fileExtension = fileType.split("/").pop()
  return `${fileName}.${fileExtension}`
}

/**
 * Given a URL, extracts the path without the file extension. For example,
 * given `https://example.com/path/to/file.txt`, it will return `path/to/file`.
 */
export const extractPathFromUrl = (url: string): string => {
  const parts = url.split("/")
  const lastPart = parts.pop()

  if (!lastPart) throw new Error(`Invalid URL: no file found!`)

  const fileNameWithoutExtension = lastPart.replace(/\.[^/.]+$/, "")

  return `${parts.pop()}/${fileNameWithoutExtension}`
}

/**
 * Computes the SHA-256 hash of a given file.
 */
export const computerSHA256 = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}
