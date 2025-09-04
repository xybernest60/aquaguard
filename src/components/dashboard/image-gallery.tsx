import Image from "next/image";
import { securityImages } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export function ImageGallery() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Captures</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {securityImages.map((image, index) => (
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
      </CardContent>
    </Card>
  );
}
