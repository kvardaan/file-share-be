import { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"

import prisma from "../utils/clients/prisma.client"
import { deleteObject, getSignedPutUrl } from "../utils/clients/s3.client"
import { getFileNameWithFileType, getPublicUrl } from "../utils/helpers"
import { config } from "../utils/env"

// POST /api/v1/file - adds a new file
export const getSignedPutUrlForFile = async (
  request: Request,
  response: Response
) => {
  try {
    const { fileName, fileSize, fileType } = request.body

    const formattedFileName = getFileNameWithFileType(fileName, fileType)

    const putUrl = await getSignedPutUrl({
      bucketName: config.awsS3BucketName!,
      fileName: formattedFileName,
      fileSize,
      fileType,
    })

    if (putUrl.error) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: putUrl.error || "Something went wrong!" })
      return
    }

    response.status(StatusCodes.OK).json({
      url: putUrl.signedUrl,
      fileName: formattedFileName,
      fileType,
      fileSize,
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
        metadata: {
          fileSize,
          fileType,
          fileName,
        },
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
      data: files,
      count: files.length,
    })
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}

// GET /api/v1/file/:id - gets a file by id
export const getFileById = async (request: Request, response: Response) => {
  const { id } = request.params

  try {
    const file = await prisma.file.findUnique({
      where: {
        id: Number(id),
      },
    })

    response.status(StatusCodes.OK).json(file)
  } catch (error) {
    response
      .status(StatusCodes.INSUFFICIENT_STORAGE)
      .json({ error: "Something went wrong!" })
  }
}

// PATCH /api/v1/file/:id - updates a file by id
// export const updateFileById = async (request: Request, response: Response) => {}

// DELETE /api/v1/file/:id - deletes a file by id
export const deleteFileById = async (request: Request, response: Response) => {
  const { id } = request.params
  const { fileName } = request.body

  try {
    // here the id should be fileName
    const deleteFileFromAws = await deleteObject(
      config.awsS3BucketName!,
      fileName
    )

    if (!deleteFileFromAws.success) {
      response
        .status(StatusCodes.FAILED_DEPENDENCY)
        .json({ error: deleteFileFromAws.error })
    } else {
      await prisma.file.delete({
        where: {
          id: Number(id),
        },
      })
      response
        .status(StatusCodes.OK)
        .json({ message: "File deleted successfully!" })
    }
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
  }
}
