import { Router } from "express"

import {
  createFile,
  deleteFileById,
  getAllFiles,
  getSignedPutUrlForFile,
} from "../controllers/file.controller"
import { doesFileExist } from "../middlewares/file.middleware"

const router = Router()

router.post("/put-url", getSignedPutUrlForFile) // get signed put url
router.post("/add", createFile) // add new file to db
router.get("/", getAllFiles) // get all files
router.delete("/:id", doesFileExist, deleteFileById) // delete file by id

export { router as fileRoutes }
