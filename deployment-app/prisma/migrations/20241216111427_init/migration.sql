/*
  Warnings:

  - You are about to drop the column `environmentVariables` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `gitBranchName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `gitCommitHash` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `gitCommitUrl` on the `Project` table. All the data in the column will be lost.
  - Added the required column `gitBranchName` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gitCommitHash` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "environmentVariables" TEXT,
ADD COLUMN     "gitBranchName" TEXT NOT NULL,
ADD COLUMN     "gitCommitHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "environmentVariables",
DROP COLUMN "gitBranchName",
DROP COLUMN "gitCommitHash",
DROP COLUMN "gitCommitUrl";
