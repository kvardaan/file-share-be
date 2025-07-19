import express from "express"

import { loggingMiddleware } from "./middlewares"
import { rootRouter } from "./routes"

const app = express()

app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ limit: "100mb", extended: true }))
app.use(loggingMiddleware)

app.use("/api/v1", rootRouter)

export default app
