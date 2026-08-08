-- AlterTable: Program
ALTER TABLE `Program` ADD COLUMN `progressionType` ENUM('LINEAR', 'EXPONENTIAL') NOT NULL DEFAULT 'LINEAR',
    ADD COLUMN `roundTo` DOUBLE NOT NULL DEFAULT 2.5;

-- AlterTable: WorkoutExercise — add new columns (nullable first)
ALTER TABLE `WorkoutExercise` ADD COLUMN `minReps` INTEGER NULL,
    ADD COLUMN `maxReps` INTEGER NULL,
    ADD COLUMN `startWeight` DOUBLE NULL,
    ADD COLUMN `targetWeight` DOUBLE NULL;

-- Migrate: parse repRange into minReps/maxReps
-- Format: "10-12", "30-60s", "AMRAP", "to failure", single number
UPDATE `WorkoutExercise`
SET `minReps` = CASE
    WHEN `repRange` REGEXP '^[0-9]+-[0-9]+' THEN CAST(SUBSTRING_INDEX(`repRange`, '-', 1) AS SIGNED)
    WHEN `repRange` REGEXP '^[0-9]+$' THEN CAST(`repRange` AS SIGNED)
    ELSE 1
END,
`maxReps` = CASE
    WHEN `repRange` REGEXP '^[0-9]+-[0-9]+' THEN CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(`repRange`, '-', -1), 's', 1) AS SIGNED)
    WHEN `repRange` REGEXP '^[0-9]+$' THEN CAST(`repRange` AS SIGNED)
    ELSE 20
END
WHERE `repRange` IS NOT NULL;

-- Tighten: make minReps/maxReps non-null
ALTER TABLE `WorkoutExercise` MODIFY COLUMN `minReps` INTEGER NOT NULL,
    MODIFY COLUMN `maxReps` INTEGER NOT NULL;

-- Drop: repRange
ALTER TABLE `WorkoutExercise` DROP COLUMN `repRange`;
