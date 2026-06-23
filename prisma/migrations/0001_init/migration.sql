CREATE TABLE "Case" (
  "id"               TEXT NOT NULL,
  "identifyingTerms" TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);
