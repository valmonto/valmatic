import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UserListSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between px-4 py-3.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      <div className="h-px bg-border/60" />
      <CardContent className="p-1.5">
        <ul>
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-2.5 py-2">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
