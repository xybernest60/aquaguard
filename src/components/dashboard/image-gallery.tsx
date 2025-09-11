
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { ref, onValue, query, limitToLast } from "firebase/database";

interface SecurityImage {
  url: string;
  timestamp: number;
}

// A simple function to check if a URL is a valid Supabase URL
const isValidSupabaseUrl = (url: string | null): url is string => {
    if (!url || url === 'N/A') return false;
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:' && parsedUrl.hostname.endsWith('supabase.co');
    } catch (e) {
        return false;
    }
};


export function ImageGallery() {
  const [images, setImages] = useState<SecurityImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const securityRef = ref(db, 'security');
    const imagesQuery = query(securityRef, limitToLast(20)); // Get last 20 events

    const unsubscribe = onValue(imagesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedImages: SecurityImage[] = Object.keys(data)
            .map(key => data[key])
            .filter(item => isValidSupabaseUrl(item.image)) // ESP32 code uses 'image' field
            .map(item => ({
                url: item.image!,
                timestamp: new Date(item.timestamp).getTime(),
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort descending
            
        setImages(formattedImages);
      }
      setIsLoading(false);
    });

    return () => {
        unsubscribe();
    }

  }, []);

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
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
          <Carousel opts={{ align: "start", loop: images.length > 1 }}>
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
