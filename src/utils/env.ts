import { config as configDotenv } from "dotenv"

configDotenv()

const _config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  maxCacheSize: 10,
  awsS3Region: process.env.AWS_S3_REGION,
  awsS3AccessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  awsS3SecretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  awsS3BucketName: process.env.AWS_S3_BUCKET_NAME,
}

export const config = Object.freeze(_config)
