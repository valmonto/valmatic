import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UserDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <CardAction>
          <Skeleton className="h-8 w-14 rounded-md" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd><Skeleton className="h-4 w-48" /></dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd><Skeleton className="h-4 w-32" /></dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd><Skeleton className="h-5 w-16 rounded-lg" /></dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd><Skeleton className="h-4 w-24" /></dd>
        </dl>
        <div className="flex gap-2 border-t border-border/50 pt-4">
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
