-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_url_caseId_key" ON "Candidate"("url", "caseId");

-- CreateIndex
CREATE INDEX "Candidate_caseId_idx" ON "Candidate"("caseId");
