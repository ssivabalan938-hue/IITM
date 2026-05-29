-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GovRole" AS ENUM ('ADMIN', 'ENGINEER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ANALYZED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ConstructionState" AS ENUM ('PENDING', 'APPROVED', 'UNDER_CONSTRUCTION', 'COMPLETED');

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "aadharNo" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "designation" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "govRole" "GovRole" NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "GovernmentUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "citizenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "thresholdCount" INTEGER NOT NULL DEFAULT 1,
    "isRiskAnalyzed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotspot" (
    "id" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "historicalAccidents" INTEGER NOT NULL,
    "roadClass" TEXT NOT NULL,
    "junctionType" TEXT NOT NULL,
    "pcuPerHour" INTEGER NOT NULL,
    "envLighting" TEXT NOT NULL,
    "roadSurface" TEXT NOT NULL,
    "predictedRiskScore" DOUBLE PRECISION NOT NULL,
    "predictedCause" TEXT NOT NULL,
    "actualHistoricalCause" TEXT NOT NULL,
    "isHeldOut" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "isTop10" BOOLEAN NOT NULL DEFAULT false,
    "suggestedFix" TEXT NOT NULL,
    "ircReference" TEXT NOT NULL,
    "expertRelevanceRating" DOUBLE PRECISION NOT NULL,
    "lastAudited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "futureTrend" TEXT NOT NULL,
    "renderPriority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Hotspot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiReport" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskCause" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionStatus" (
    "id" TEXT NOT NULL,
    "aiReportId" TEXT NOT NULL,
    "status" "ConstructionState" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "beforePhotoUrl" TEXT,
    "constructionPhotoUrl" TEXT,
    "completionPhotoUrl" TEXT,
    "engineeringNotes" TEXT,
    "governmentNotes" TEXT,
    "budgetDetails" TEXT,
    "internalRecommendations" TEXT,
    "assignedTeam" TEXT,
    "severityScore" DOUBLE PRECISION,
    "priorityRank" DOUBLE PRECISION,
    "engineerId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_aadharNo_key" ON "Citizen"("aadharNo");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_email_key" ON "Citizen"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentUser_officialEmail_key" ON "GovernmentUser"("officialEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AiReport_complaintId_key" ON "AiReport"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionStatus_aiReportId_key" ON "ConstructionStatus"("aiReportId");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReport" ADD CONSTRAINT "AiReport_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionStatus" ADD CONSTRAINT "ConstructionStatus_aiReportId_fkey" FOREIGN KEY ("aiReportId") REFERENCES "AiReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionStatus" ADD CONSTRAINT "ConstructionStatus_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "GovernmentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
