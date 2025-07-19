import morgan from "morgan"
import { Request } from "express"

morgan.token("post-body", (request: Request) => {
  const methodsWithBody = ["POST"]

  if (methodsWithBody.includes(request.method)) {
    return JSON.stringify(request.body)
  }
})

export const loggingMiddleware = morgan((tokens, request, response) => {
  return [
    tokens.method(request, response),
    tokens.url(request, response),
    tokens.status(request, response),
    tokens.res(request, response, "content-length"),
    "-",
    tokens["response-time"](request, response),
    "ms",
  ].join(" ")
})
