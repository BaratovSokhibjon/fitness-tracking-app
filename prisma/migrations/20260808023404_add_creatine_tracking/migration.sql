-- AlterTable
ALTER TABLE `Profile` ADD COLUMN `creatineEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `creatineLoadingDays` INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN `creatineLoadingDose` DOUBLE NOT NULL DEFAULT 20,
    ADD COLUMN `creatineMaintenanceDose` DOUBLE NOT NULL DEFAULT 5,
    ADD COLUMN `creatineProtocol` ENUM('LOADING', 'MAINTENANCE_ONLY') NOT NULL DEFAULT 'MAINTENANCE_ONLY',
    ADD COLUMN `creatineStartDate` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `CreatineLog` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `doseGrams` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CreatineLog_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
