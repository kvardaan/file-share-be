import { Router } from "express"

import {
  createFile,
  deleteFileById,
  finishMultipartUpload,
  getAllFiles,
  getPresignedPartUrls,
  getSignedPutUrlForFile,
  initiateMultipartUpload,
} from "../controllers/file.controller"
import { doesFileExist } from "../middlewares/file.middleware"

const router = Router()

router.post("/put-url", getSignedPutUrlForFile) // get signed put url
router.post("/add", createFile) // add new file to db
router.get("/", getAllFiles) // get all files
router.delete("/:id", doesFileExist, deleteFileById) // delete file by id
router.post("/initiate-multipart-upload", initiateMultipartUpload) // initiate multipart upload
router.post("/presigned-part-urls", getPresignedPartUrls) // get presigned part urls
router.post("/complete-multipart-upload", finishMultipartUpload) // complete multipart upload

export { router as fileRoutes }
