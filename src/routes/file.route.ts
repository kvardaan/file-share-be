import { Router } from "express"

import {
  createFile,
  deleteFileById,
  getAllFiles,
  getFileById,
  getSignedPutUrlForFile,
} from "../controllers/file.controller"
import { doesFileExist } from "../middlewares/file.middleware"

const router = Router()

router.post("/", getSignedPutUrlForFile) // get signed put url
router.post("/add", createFile) // add new file to db
router.get("/", getAllFiles) // get all files
router.get("/:id", doesFileExist, getFileById) // get file by id
// router.patch("/:id", updateFileById) // update file by id
router.delete("/:id", doesFileExist, deleteFileById) // delete file by id

export { router as fileRoutes }
