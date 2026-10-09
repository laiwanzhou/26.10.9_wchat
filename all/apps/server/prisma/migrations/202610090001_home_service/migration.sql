CREATE TABLE "Administrator" ("id" TEXT PRIMARY KEY, "username" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL);
CREATE TABLE "Session" ("tokenHash" TEXT PRIMARY KEY, "administratorId" TEXT NOT NULL REFERENCES "Administrator"("id") ON DELETE CASCADE, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE TABLE "ImageAsset" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "objectKey" TEXT NOT NULL UNIQUE, "mime" TEXT NOT NULL, "size" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "HomeConfig" ("id" TEXT PRIMARY KEY DEFAULT 'home', "title" TEXT NOT NULL, "subtitle" TEXT NOT NULL, "bannerAssetId" TEXT UNIQUE REFERENCES "ImageAsset"("id") ON DELETE RESTRICT);
CREATE TABLE "ObjectDeletion" ("objectKey" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
