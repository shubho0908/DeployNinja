/*
  Warnings:

  - You are about to drop the column `buildCommand` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `customDomain` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `environmentVariables` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `gitBranchName` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `gitCommitHash` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `gitCommitUrl` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `gitRepoUrl` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `installCommand` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `projectRootDir` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `subDomain` on the `Deployment` table. All the data in the column will be lost.
  - Added the required column `gitBranchName` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gitCommitHash` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gitCommitUrl` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gitRepoUrl` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subDomain` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "buildCommand",
DROP COLUMN "customDomain",
DROP COLUMN "environmentVariables",
DROP COLUMN "gitBranchName",
DROP COLUMN "gitCommitHash",
DROP COLUMN "gitCommitUrl",
DROP COLUMN "gitRepoUrl",
DROP COLUMN "installCommand",
DROP COLUMN "projectRootDir",
DROP COLUMN "subDomain";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "buildCommand" TEXT,
ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "environmentVariables" TEXT,
ADD COLUMN     "gitBranchName" TEXT NOT NULL,
ADD COLUMN     "gitCommitHash" TEXT NOT NULL,
ADD COLUMN     "gitCommitUrl" TEXT NOT NULL,
ADD COLUMN     "gitRepoUrl" TEXT NOT NULL,
ADD COLUMN     "installCommand" TEXT,
ADD COLUMN     "projectRootDir" TEXT,
ADD COLUMN     "subDomain" TEXT NOT NULL;
