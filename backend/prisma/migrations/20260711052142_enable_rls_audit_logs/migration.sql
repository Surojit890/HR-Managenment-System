-- AlterTable
ALTER TABLE "employee_profiles" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "uanNumber" TEXT;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "attachment" TEXT;

-- AlterTable
ALTER TABLE "payroll" ADD COLUMN     "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherAllowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pf" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verifyToken" TEXT,
ADD COLUMN     "verifyTokenExpires" TIMESTAMP(3);
