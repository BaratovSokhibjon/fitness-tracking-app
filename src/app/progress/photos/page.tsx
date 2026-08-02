import Link from "next/link";
import { getPhotos } from "@/actions/progress";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/progress/photo-gallery";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const photos = await getPhotos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress Photos</h1>
          <p className="text-sm text-muted-foreground">Visual progress over time.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/progress">← Measurements</Link>
        </Button>
      </div>
      <PhotoGallery photos={photos} />
    </div>
  );
}
