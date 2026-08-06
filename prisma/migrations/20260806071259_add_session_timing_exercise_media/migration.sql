-- AlterTable
ALTER TABLE `Exercise` ADD COLUMN `mediaUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WorkoutSession` ADD COLUMN `finishedAt` DATETIME(3) NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL;
