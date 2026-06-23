-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "identifyingTerms" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
