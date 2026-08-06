import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultHabits = [
  { name: "Creatine", sortOrder: 0 },
  { name: "Vitamins", sortOrder: 1 },
  { name: "Stretching", sortOrder: 2 },
  { name: "Mobility", sortOrder: 3 },
  { name: "No Junk Food", sortOrder: 4 },
  { name: "Screen Off Before Bed", sortOrder: 5 },
];

const defaultGoals = [
  { name: "Target Weight", targetValue: 82, currentValue: 76.8, unit: "kg", type: "WEIGHT" as const },
  { name: "Daily Protein", targetValue: 160, currentValue: 0, unit: "g", type: "NUTRITION" as const },
  { name: "Daily Sleep", targetValue: 8, currentValue: 0, unit: "hours", type: "SLEEP" as const },
  { name: "Daily Steps", targetValue: 10000, currentValue: 0, unit: "steps", type: "STEPS" as const },
];

const seedFoods = [
  { name: "White Bread", servingSize: 100, servingUnit: "g", caloriesPerServing: 265, proteinPerServing: 9, carbsPerServing: 49, fatPerServing: 3.2, category: "CARBS" as const },
  { name: "Eggs (whole)", servingSize: 1, servingUnit: "egg", caloriesPerServing: 70, proteinPerServing: 6, carbsPerServing: 0.6, fatPerServing: 5, category: "PROTEIN" as const },
  { name: "Chicken Breast", servingSize: 100, servingUnit: "g", caloriesPerServing: 165, proteinPerServing: 31, carbsPerServing: 0, fatPerServing: 3.6, category: "PROTEIN" as const },
  { name: "White Rice (cooked)", servingSize: 100, servingUnit: "g", caloriesPerServing: 130, proteinPerServing: 2.7, carbsPerServing: 28, fatPerServing: 0.3, category: "CARBS" as const },
  { name: "Banana", servingSize: 1, servingUnit: "medium", caloriesPerServing: 105, proteinPerServing: 1.3, carbsPerServing: 27, fatPerServing: 0.4, category: "SNACK" as const },
  { name: "Olive Oil", servingSize: 15, servingUnit: "ml", caloriesPerServing: 119, proteinPerServing: 0, carbsPerServing: 0, fatPerServing: 13.5, category: "FATS" as const },
  { name: "Greek Yogurt", servingSize: 100, servingUnit: "g", caloriesPerServing: 59, proteinPerServing: 10, carbsPerServing: 3.6, fatPerServing: 0.7, category: "PROTEIN" as const },
  { name: "Oats", servingSize: 100, servingUnit: "g", caloriesPerServing: 389, proteinPerServing: 17, carbsPerServing: 66, fatPerServing: 7, category: "CARBS" as const },
  { name: "Whey Protein", servingSize: 30, servingUnit: "g", caloriesPerServing: 120, proteinPerServing: 24, carbsPerServing: 3, fatPerServing: 1.5, category: "PROTEIN" as const },
  { name: "Peanut Butter", servingSize: 32, servingUnit: "g", caloriesPerServing: 190, proteinPerServing: 8, carbsPerServing: 6, fatPerServing: 16, category: "FATS" as const },
];

const programWorkouts = [
  {
    name: "Push",
    dayOfWeek: 1,
    sortOrder: 0,
    exercises: [
      { name: "Push-ups", sets: 4, repRange: "10-20", restTime: 90 },
      { name: "Pike Push-ups", sets: 3, repRange: "8-12", restTime: 90 },
      { name: "Chair Dips", sets: 3, repRange: "10-15", restTime: 90 },
      { name: "Diamond Push-ups", sets: 3, repRange: "8-12", restTime: 90 },
    ],
  },
  {
    name: "Pull",
    dayOfWeek: 3,
    sortOrder: 1,
    exercises: [
      { name: "Pull-ups", sets: 4, repRange: "6-12", restTime: 90 },
      { name: "Backpack Rows", sets: 3, repRange: "10-15", restTime: 90 },
      { name: "Reverse Fly", sets: 3, repRange: "12-15", restTime: 60 },
      { name: "Bicep Curls", sets: 3, repRange: "10-15", restTime: 60 },
    ],
  },
  {
    name: "Legs",
    dayOfWeek: 5,
    sortOrder: 2,
    exercises: [
      { name: "Squats", sets: 4, repRange: "12-20", restTime: 90 },
      { name: "Bulgarian Split Squats", sets: 3, repRange: "10-15", restTime: 90 },
      { name: "Romanian Deadlift", sets: 3, repRange: "12-15", restTime: 90 },
      { name: "Calf Raises", sets: 4, repRange: "15-25", restTime: 60 },
    ],
  },
  {
    name: "Full Body",
    dayOfWeek: 6,
    sortOrder: 3,
    exercises: [
      { name: "Push-ups", sets: 3, repRange: "10-15", restTime: 60 },
      { name: "Pull-ups", sets: 3, repRange: "6-10", restTime: 60 },
      { name: "Squats", sets: 3, repRange: "15-20", restTime: 60 },
      { name: "Plank", sets: 3, repRange: "30-60s", restTime: 45 },
    ],
  },
];

async function main() {
  console.log("Seeding...");

  const profile = await prisma.profile.upsert({
    where: { id: "default-profile" },
    update: {},
    create: {
      id: "default-profile",
      age: 30,
      height: 178,
      programStartDate: new Date(),
      dailyCaloriesTarget: 2200,
      dailyProteinTarget: 160,
      dailyCarbsTarget: 250,
      dailyFatTarget: 70,
      dailyWaterTarget: 3000,
      dailyStepsTarget: 10000,
      sleepTarget: 8,
    },
  });
  console.log("  profile:", profile.id);

  for (const h of defaultHabits) {
    await prisma.habit.upsert({
      where: { name: h.name },
      update: {},
      create: h,
    });
  }
  console.log("  habits:", defaultHabits.length);

  const foodCount = await prisma.foodItem.count();
  if (foodCount === 0) {
    for (const f of seedFoods) {
      await prisma.foodItem.create({ data: f });
    }
    console.log("  foods:", seedFoods.length);
  } else {
    console.log("  foods: skipped (already present)");
  }

  const goalCount = await prisma.goal.count();
  if (goalCount === 0) {
    for (const g of defaultGoals) {
      await prisma.goal.create({ data: g });
    }
    console.log("  goals:", defaultGoals.length);
  } else {
    console.log("  goals: skipped (already present)");
  }

  const existingProgram = await prisma.program.findFirst({ where: { name: "8-Week Transformation" } });
  let program;
  if (existingProgram) {
    program = existingProgram;
  } else {
    program = await prisma.program.create({
      data: {
        name: "8-Week Transformation",
        description: "Full body transformation program — 4 workouts per week.",
        durationWeeks: 8,
        isActive: true,
        workouts: {
          create: programWorkouts.map((w) => ({
            name: w.name,
            dayOfWeek: w.dayOfWeek,
            sortOrder: w.sortOrder,
            exercises: {
              create: w.exercises.map((e, i) => ({ ...e, sortOrder: i })),
            },
          })),
        },
      },
    });
  }
  console.log("  program:", program.id);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
