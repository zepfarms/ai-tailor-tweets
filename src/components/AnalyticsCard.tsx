
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
}) => {
  return (
    <Card className="glass-card overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        )}
        {trend && (
          <div className="flex items-center mt-1">
            <span className={`text-xs font-medium flex items-center ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
