-- AlterTable
ALTER TABLE `BodyMeasurement` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CreatineLog` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `DailyCheckIn` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ExerciseLog` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Goal` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `HabitLog` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `MealTemplate` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Profile` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Program` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WorkoutSchedule` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WorkoutSession` ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: assign existing rows to the default user.
-- The seed script creates the User row with id 'default-user' from SEED_EMAIL/SEED_PASSWORD.
-- Insert the user first so the FKs below resolve.
INSERT INTO `User` (`id`, `email`, `passwordHash`, `createdAt`, `updatedAt`)
VALUES ('default-user', 'pending@local', 'pending', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

UPDATE `Profile` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `DailyCheckIn` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `CreatineLog` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `BodyMeasurement` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `Program` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `MealTemplate` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `Goal` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `HabitLog` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `WorkoutSchedule` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `WorkoutSession` SET `userId` = 'default-user' WHERE `userId` IS NULL;
UPDATE `ExerciseLog` SET `userId` = 'default-user' WHERE `userId` IS NULL;

-- CreateTable
CREATE TABLE `DeviceToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeviceToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reminder` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `days` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DeviceToken` ADD CONSTRAINT `DeviceToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
