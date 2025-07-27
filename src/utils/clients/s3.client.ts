import {
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandOutput,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  UploadPartCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { uuid } from "zod"

import { config } from "../env"
import { allowedFileTypes, maxAllowedFileSize } from "../constants"

const s3Client = new S3Client({
  region: String(config.awsS3Region),
  credentials: {
    accessKeyId: String(config.awsS3AccessKeyId),
    secretAccessKey: String(config.awsS3SecretAccessKey),
  },
})

/**
 * Creates a presigned URL for downloading an object from AWS S3
 */
export const createPresignedGetURL = async (
  bucketName: string,
  key: string
): Promise<{
  success: boolean
  signedUrl?: string
  error?: string
}> => {
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
export const getSignedPutUrl = async (
  bucketName: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{
  success: boolean
  signedUrl?: string
  error?: string
}> => {
  if (!allowedFileTypes.includes(fileType)) {
    return { success: false, error: "Invalid file type!" }
  }

  if (fileSize > maxAllowedFileSize) {
    return { success: false, error: "File size too large!" }
  }

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
    ContentLength: fileSize,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 1800, // 30 minutes
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

/**
 * Creates a new multipart upload in AWS S3
 * & returns the uploadId and key
 */
export const createMultipartUpload = async (
  bucketName: string,
  fileName: string,
  fileType: string
): Promise<{
  success: boolean
  uploadId?: string
  key?: string
  error?: string
}> => {
  if (!allowedFileTypes.includes(fileType)) {
    return { success: false, error: "Invalid file type!" }
  }

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
  })

  try {
    const { UploadId } = await s3Client.send(command)
    return { success: true, uploadId: UploadId, key: fileName }
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

type tMultipartUploadPart = {
  PartNumber: number
  ETag: string
}

/**
 * Completes a multipart upload in AWS S3
 */
export const completeMultipartUpload = async (
  bucketName: string,
  key: string,
  uploadId: string,
  parts: tMultipartUploadPart[]
): Promise<{
  success: boolean
  error?: string
  result?: CompleteMultipartUploadCommandOutput
}> => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map(({ PartNumber, ETag }) => ({
        PartNumber,
        ETag,
      })),
    },
  })

  try {
    const result: CompleteMultipartUploadCommandOutput =
      await s3Client.send(command)
    return { success: true, result }
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

type tPresignedPartUrl = {
  partNumber: number
  signedUrl: string
}

export const getMultipartPresignedPartUrls = async (
  bucketName: string,
  key: string,
  uploadId: string,
  partsCount: number
): Promise<{
  success: boolean
  error?: string
  urls?: tPresignedPartUrl[]
}> => {
  try {
    const urls: tPresignedPartUrl[] = []

    for (let i = 1; i <= partsCount; i++) {
      const command = new UploadPartCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: i,
      })

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      })

      urls.push({ partNumber: i, signedUrl })
    }

    return { success: true, urls }
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
