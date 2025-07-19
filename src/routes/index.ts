import { Router } from "express"

import { fileRoutes } from "./file.route"

const router = Router()

router.use("/file", fileRoutes)

export { router as rootRouter }
