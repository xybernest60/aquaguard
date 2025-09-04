import type { FC, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  unit: string;
  description?: string;
  statusColor?: string;
}

export const DataCard: FC<DataCardProps> = ({
  icon,
  title,
  value,
  unit,
  description,
  statusColor = "text-foreground",
}) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${statusColor}`}>
          {value} <span className="text-lg font-normal">{unit}</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
