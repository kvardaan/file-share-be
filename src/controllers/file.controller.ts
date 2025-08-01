import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"

import prisma from "../utils/clients/prisma.client"
import {
  deleteObject,
  getSignedPutUrl,
  createMultipartUpload,
  completeMultipartUpload,
  getMultipartPresignedPartUrls,
} from "../utils/clients/s3.client"
import { getFileNameWithFileType, getPublicUrl } from "../utils/helpers"
import { config } from "../utils/env"

// POST /api/v1/file/put-url - adds a new file
export const getSignedPutUrlForFile = async (
  request: Request,
  response: Response
) => {
  try {
    const { fileName, fileSize, fileType } = request.body

    const formattedFileName = getFileNameWithFileType(fileName, fileType)

    // get signed put url
    const putUrl = await getSignedPutUrl(
      config.awsS3BucketName!,
      formattedFileName,
      fileSize,
      fileType
    )

    // if there was an error
    if (!putUrl.success) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: putUrl.error || "Something went wrong!" })
      return
    }

    response.status(StatusCodes.OK).json({
      url: putUrl.signedUrl,
      fileName: formattedFileName,
    })
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// POST /api/v1/file/add - adds a new file
export const createFile = async (request: Request, response: Response) => {
  try {
    const { fileName, fileSize, fileType } = request.body

    const imagePublicUrl = getPublicUrl(fileName)

    const createdFile = await prisma.file.create({
      data: {
        url: imagePublicUrl,
        metadata: JSON.stringify({
          fileSize,
          fileType,
          fileName,
        }),
      },
    })

    response.status(StatusCodes.OK).json({ file: createdFile })
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// GET /api/v1/file - gets all files
export const getAllFiles = async (request: Request, response: Response) => {
  try {
    const files = await prisma.file.findMany()

    response.status(StatusCodes.OK).json({
      files,
      count: files.length,
    })
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// DELETE /api/v1/file/:id - deletes a file by id
export const deleteFileById = async (request: Request, response: Response) => {
  const { id } = request.params

  try {
    const file = await prisma.file.findUnique({
      where: {
        id: Number(id),
      },
    })

    // if file was not found
    if (!file || !file.metadata) {
      response
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "File not found!" })
      return
    }

    const fileMetadata = JSON.parse(file?.metadata)

    // delete file from aws
    const deleteFileFromAws = await deleteObject(
      config.awsS3BucketName!,
      fileMetadata.fileName
    )

    // check if file was deleted
    if (!deleteFileFromAws.success) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: deleteFileFromAws.error })
      return
    }

    // delete file from db
    await prisma.file.delete({
      where: {
        id: Number(id),
      },
    })

    response
      .status(StatusCodes.OK)
      .json({ message: "File deleted successfully!" })
  } catch {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// POST /api/v1/file/initiate-multipart-upload
export const initiateMultipartUpload = async (
  request: Request,
  response: Response
) => {
  try {
    const { fileName, fileType } = request.body

    const formattedFileName = getFileNameWithFileType(fileName, fileType)

    const initUpload = await createMultipartUpload(
      config.awsS3BucketName!,
      formattedFileName,
      fileType
    )

    if (!initUpload.success) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: initUpload.error })
      return
    }

    const { uploadId, key } = initUpload

    response.status(StatusCodes.OK).json({
      uploadId,
      key,
      fileName: formattedFileName,
    })
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// POST /api/v1/file/complete-multipart-upload
export const finishMultipartUpload = async (
  request: Request,
  response: Response
) => {
  try {
    const { uploadId, key, parts } = request.body

    const multipartUpload = await completeMultipartUpload(
      config.awsS3BucketName!,
      key,
      uploadId,
      parts
    )

    if (!multipartUpload.success) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: multipartUpload.error })
      return
    }

    response.status(StatusCodes.OK).json({
      message: "File uploaded successfully!",
    })
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// POST /api/v1/file/presigned-part-urls
export const getPresignedPartUrls = async (
  request: Request,
  response: Response
) => {
  try {
    const { uploadId, key, partsCount } = request.body

    const presignedPartUrls = await getMultipartPresignedPartUrls(
      config.awsS3BucketName!,
      key,
      uploadId,
      partsCount
    )

    if (!presignedPartUrls.success) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: presignedPartUrls.error })
      return
    }

    response.status(StatusCodes.OK).json({
      urls: presignedPartUrls.urls,
    })
  } catch (error) {
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Something went wrong!",
    })
  }
}
