
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { SecurityImage } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

// A simple function to check if a URL is valid and from Supabase
const isValidSupabaseUrl = (url: string | null): url is string => {
    if (!url) return false;
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
    const fetchImages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('security')
        .select('capture_url, timestamp')
        .not('capture_url', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (data) {
        const formattedImages: SecurityImage[] = data
            .filter(item => isValidSupabaseUrl(item.capture_url))
            .map(item => ({
                url: item.capture_url!,
                timestamp: new Date(item.timestamp).getTime(),
            }));
        setImages(formattedImages);
      }
      setIsLoading(false);
    };

    fetchImages();

    const channel = supabase
      .channel('security-image-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security' }, (payload) => {
        if(isValidSupabaseUrl(payload.new.capture_url)) {
            const newImage: SecurityImage = {
                url: payload.new.capture_url!,
                timestamp: new Date(payload.new.timestamp).getTime()
            };
            setImages(currentImages => [newImage, ...currentImages]);
        }
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
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
