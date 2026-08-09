-- Scope all data to the User: tighten userId to NOT NULL, swap unique
-- constraints to composite (userId, ...), and add foreign keys to User.

-- Drop old single-column uniques
ALTER TABLE `DailyCheckIn` DROP INDEX `DailyCheckIn_date_key`;
ALTER TABLE `CreatineLog` DROP INDEX `CreatineLog_date_key`;
ALTER TABLE `BodyMeasurement` DROP INDEX `BodyMeasurement_date_key`;
ALTER TABLE `WorkoutSchedule` DROP INDEX `WorkoutSchedule_date_key`;
-- HabitLog_habitId_date_key backs the HabitLog_habitId_fkey FK — drop the FK first.
ALTER TABLE `HabitLog` DROP FOREIGN KEY `HabitLog_habitId_fkey`;
ALTER TABLE `HabitLog` DROP INDEX `HabitLog_habitId_date_key`;
ALTER TABLE `MealTemplate` DROP INDEX `MealTemplate_name_key`;

-- Add composite uniques
ALTER TABLE `DailyCheckIn` ADD UNIQUE INDEX `DailyCheckIn_userId_date_key`(`userId`, `date`);
ALTER TABLE `CreatineLog` ADD UNIQUE INDEX `CreatineLog_userId_date_key`(`userId`, `date`);
ALTER TABLE `BodyMeasurement` ADD UNIQUE INDEX `BodyMeasurement_userId_date_key`(`userId`, `date`);
ALTER TABLE `WorkoutSchedule` ADD UNIQUE INDEX `WorkoutSchedule_userId_date_key`(`userId`, `date`);
ALTER TABLE `HabitLog` ADD UNIQUE INDEX `HabitLog_userId_habitId_date_key`(`userId`, `habitId`, `date`);
ALTER TABLE `MealTemplate` ADD UNIQUE INDEX `MealTemplate_userId_name_key`(`userId`, `name`);
ALTER TABLE `Profile` ADD UNIQUE INDEX `Profile_userId_key`(`userId`);

-- Recreate the Habit → HabitLog FK now backed by the composite unique
ALTER TABLE `HabitLog` ADD CONSTRAINT `HabitLog_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Tighten userId to NOT NULL (backfill already ran in the previous migration)
ALTER TABLE `Profile` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `DailyCheckIn` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `CreatineLog` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `BodyMeasurement` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `Program` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `MealTemplate` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `Goal` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `HabitLog` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `WorkoutSchedule` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `WorkoutSession` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `ExerciseLog` MODIFY `userId` VARCHAR(191) NOT NULL;

-- Add foreign keys to User
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Program` ADD CONSTRAINT `Program_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DailyCheckIn` ADD CONSTRAINT `DailyCheckIn_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WorkoutSchedule` ADD CONSTRAINT `WorkoutSchedule_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WorkoutSession` ADD CONSTRAINT `WorkoutSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ExerciseLog` ADD CONSTRAINT `ExerciseLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MealTemplate` ADD CONSTRAINT `MealTemplate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `HabitLog` ADD CONSTRAINT `HabitLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `BodyMeasurement` ADD CONSTRAINT `BodyMeasurement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CreatineLog` ADD CONSTRAINT `CreatineLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
