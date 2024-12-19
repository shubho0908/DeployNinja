/*
  Warnings:

  - A unique constraint covering the columns `[subDomain]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Made the column `subDomain` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "subDomain" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_subDomain_key" ON "Project"("subDomain");
