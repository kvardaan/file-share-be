/*
  Warnings:

  - Made the column `url` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `File` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "File" ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "metadata" SET NOT NULL;
