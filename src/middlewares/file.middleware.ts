import { StatusCodes } from "http-status-codes"
import { Request, Response, NextFunction } from "express"

import prisma from "../utils/clients/prisma.client"

export const doesFileExist = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { id } = request.params

  try {
    const existingFile = await prisma.file.findUnique({
      where: {
        id: Number(id),
      },
    })

    if (!existingFile) {
      response
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "File not found!" })
      return
    }

    request.body.file = existingFile

    next()
  } catch (error) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong!" })
    return
  }
}
