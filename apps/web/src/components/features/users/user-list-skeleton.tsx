import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UserListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/50">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="shrink-0 pl-4">
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
