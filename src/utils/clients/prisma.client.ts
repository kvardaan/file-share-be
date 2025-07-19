import { PrismaClient } from "@prisma/client"

import { config } from "../env"

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type tPrismaClientSingleton = typeof prismaClientSingleton

declare const globalThis: {
  prismaGlobal: ReturnType<tPrismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (config.nodeEnv !== "production") {
  globalThis.prismaGlobal = prisma
}
