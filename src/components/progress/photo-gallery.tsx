"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadPhoto, deletePhoto } from "@/actions/progress";

const typeLabels: Record<string, string> = {
  FRONT: "Front",
  SIDE: "Side",
  BACK: "Back",
};

export function PhotoGallery({ photos }: { photos: { id: string; imageUrl: string; date: Date; type: string }[] }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("FRONT");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    await uploadPhoto(date, type, file);
    setUploading(false);
    setFile(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo?")) return;
    await deletePhoto(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadSimple className="h-5 w-5 text-primary" />
            Upload Photo
          </CardTitle>
          <CardDescription>Add a progress photo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="photo-date">Date</Label>
              <Input id="photo-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo-file">File</Label>
              <Input
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative aspect-[3/4]">
                <Image
                  src={photo.imageUrl}
                  alt={`${typeLabels[photo.type]} photo`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  unoptimized
                />
              </div>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{typeLabels[photo.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {photo.date instanceof Date ? photo.date.toLocaleDateString() : new Date(photo.date).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(photo.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
