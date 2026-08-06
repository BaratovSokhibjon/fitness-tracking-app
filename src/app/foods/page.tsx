import { getFoods } from "@/actions/foods";
import { FoodsPage } from "@/components/foods/foods-page";

export const dynamic = "force-dynamic";

export default async function FoodsPageRoute() {
  const foods = await getFoods();

  return (
    <FoodsPage
      foods={foods.map((f) => ({
        id: f.id,
        name: f.name,
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        caloriesPerServing: f.caloriesPerServing,
        proteinPerServing: f.proteinPerServing,
        carbsPerServing: f.carbsPerServing,
        fatPerServing: f.fatPerServing,
        category: f.category,
        imageUrl: f.imageUrl,
      }))}
    />
  );
}
