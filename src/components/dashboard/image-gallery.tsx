"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { storage } from "@/lib/firebase";
import { ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import type { SecurityImage } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageGallery() {
  const [images, setImages] = useState<SecurityImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const imagesRef = storageRef(storage, 'security-captures');
        const result = await listAll(imagesRef);
        
        const imageUrls = await Promise.all(
          result.items.map(async (imageRef) => {
            const url = await getDownloadURL(imageRef);
            // Firebase storage metadata doesn't easily provide creation time without another call
            // For now, we'll use a placeholder timestamp.
            return { url, timestamp: Date.now() };
          })
        );
        
        // Sort images by timestamp if available, here we just take the fetched order
        setImages(imageUrls);
      } catch (error) {
        console.error("Error fetching images from Firebase Storage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
    // Optional: refetch images periodically
    const interval = setInterval(fetchImages, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Captures</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex space-x-4">
             <Skeleton className="h-32 w-1/3" />
             <Skeleton className="h-32 w-1/3" />
             <Skeleton className="h-32 w-1/3" />
          </div>
        ) : images.length > 0 ? (
          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={image.url}
                        alt={`Security capture ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint="security camera"
                      />
                      <div className="absolute bottom-0 w-full bg-black/50 p-2 text-xs text-white">
                        {/* Displaying a generic time as we don't have exact metadata */}
                        Recent Capture
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <p className="text-muted-foreground">No security images found. Your ESP32-CAM can upload images to the 'security-captures' folder in Firebase Storage.</p>
        )}
      </CardContent>
    </Card>
  );
}
