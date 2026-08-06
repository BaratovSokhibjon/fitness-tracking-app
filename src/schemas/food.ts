import { z } from "zod";

export const foodItemSchema = z.object({
  name: z.string().min(1).max(100),
  servingSize: z.number().min(0),
  servingUnit: z.string().min(1).max(20),
  caloriesPerServing: z.number().int().min(0).max(5000),
  proteinPerServing: z.number().min(0).max(500),
  carbsPerServing: z.number().min(0).max(500),
  fatPerServing: z.number().min(0).max(500),
  category: z.enum(["PROTEIN", "CARBS", "FATS", "MEAL", "SNACK", "DRINK", "OTHER"]),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type FoodItemInput = z.infer<typeof foodItemSchema>;

export const foodLogEntrySchema = z.object({
  date: z.string().datetime(),
  foodItemId: z.string().cuid(),
  quantity: z.number().min(0.1).max(100),
});

export type FoodLogEntryInput = z.infer<typeof foodLogEntrySchema>;

export const foodLogByDateSchema = z.object({
  date: z.string().datetime(),
});

export type FoodLogByDateInput = z.infer<typeof foodLogByDateSchema>;
