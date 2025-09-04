"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { SecurityImage } from "@/lib/mock-data";
import { securityImages as mockImages } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageGallery() {
  const [images, setImages] = useState<SecurityImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = () => {
      setIsLoading(true);
      // Simulate fetching images
      setTimeout(() => {
        setImages(mockImages);
        setIsLoading(false);
      }, 1000);
    };

    fetchImages();
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
                        {new Date(image.timestamp).toLocaleString()}
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
          <p className="text-muted-foreground">No security images found.</p>
        )}
      </CardContent>
    </Card>
  );
}
