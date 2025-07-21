import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { config } from "../env"

const allowedFileTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp3",
]

const maxFileSize = 100 * 1024 * 1024 // 100MB

const s3Client = new S3Client({
  region: String(config.awsS3Region),
  credentials: {
    accessKeyId: String(config.awsS3AccessKeyId),
    secretAccessKey: String(config.awsS3SecretAccessKey),
  },
})

type tGetSignedPutUrlParams = {
  bucketName: string
  fileName: string
  fileType: string
  fileSize: number
  // checksum: string
}

type tGetSignedPutUrlResponse = Promise<{
  success: boolean
  signedUrl?: string
  error?: string
}>

/**
 * Creates a presigned URL for downloading an object from AWS S3
 */
export const createPresignedGetURL = async (
  bucketName: string,
  key: string
): Promise<{ success: boolean; signedUrl?: string; error?: string }> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, command)
    return { signedUrl, success: true }
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return { success: false, error: "No such file exists!" }
    } else if (error instanceof S3ServiceException) {
      console.error({
        error: {
          name: error.name,
          message: error.message,
        },
      })
      return { success: false, error: "Error fetching file!" }
    } else {
      console.error(error)
      return { success: false, error: "Something went wrong!" }
    }
  }
}

/**
 * Creates a presigned URL for uploading an object to AWS S3
 */
export const getSignedPutUrl = async ({
  bucketName,
  fileName,
  fileType,
  fileSize,
  // checksum,
}: tGetSignedPutUrlParams): Promise<tGetSignedPutUrlResponse> => {
  if (!allowedFileTypes.includes(fileType)) {
    return { success: false, error: "Invalid file type!" }
  }

  if (fileSize > maxFileSize) {
    return { success: false, error: "File size too large!" }
  }

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
    ContentLength: fileSize,
    // ContentMD5: checksum,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 600, // 10 minutes
    })
    return { success: true, signedUrl }
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error({
        error: {
          name: error.name,
          message: error.message,
        },
      })
      return { success: false }
    } else {
      console.error(error)
      return { success: false }
    }
  }
}

/**
 * Deletes an object from AWS S3
 */
export const deleteObject = async (
  bucketName: string,
  key: string
): Promise<{ success: boolean; error?: string }> => {
  const deleteObjectCommand = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  try {
    await s3Client.send(deleteObjectCommand)
    return { success: true }
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error({
        error: {
          name: error.name,
          message: error.message,
        },
      })
      return { success: false, error: "Error deleting file!" }
    } else {
      console.error(error)
      return { success: false, error: "Something went wrong!" }
    }
  }
}

/**
 * Updates an object in AWS S3
 */
export const updateObject = async (
  bucketName: string,
  key: string,
  body: string
) => {
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
  })

  try {
    await s3Client.send(putObjectCommand)
    return { success: true }
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error({
        error: {
          name: error.name,
          message: error.message,
        },
      })
      return { success: false, error: "Error updating file!" }
    } else {
      console.error(error)
      return { success: false, error: "Something went wrong!" }
    }
  }
}
