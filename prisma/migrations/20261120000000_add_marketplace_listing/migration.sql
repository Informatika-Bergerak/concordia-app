-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('BOOKS', 'ELECTRONICS', 'FASHION', 'VEHICLES', 'BOARDING_HOUSE', 'SERVICES', 'FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingCondition" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "ListingAvailability" AS ENUM ('AVAILABLE', 'LIMITED', 'SOLD');

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "category" "ListingCategory" NOT NULL,
    "condition" "ListingCondition" NOT NULL,
    "availability" "ListingAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT NOT NULL,
    "allowCod" BOOLEAN NOT NULL DEFAULT true,
    "allowShipping" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sellerId" INTEGER NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id"),
    -- Batas harga sama dengan MAX_PRICE di aplikasi (Rp 100 miliar).
    CONSTRAINT "Listing_price_check" CHECK ("price" > 0 AND "price" <= 100000000000),
    -- Minimal satu preferensi penjualan (COD atau ekspedisi).
    CONSTRAINT "Listing_preference_check" CHECK ("allowCod" OR "allowShipping")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "format" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Listing_isActive_createdAt_idx" ON "Listing"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPhoto_publicId_key" ON "ListingPhoto"("publicId");

-- CreateIndex
CREATE INDEX "ListingPhoto_listingId_idx" ON "ListingPhoto"("listingId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
