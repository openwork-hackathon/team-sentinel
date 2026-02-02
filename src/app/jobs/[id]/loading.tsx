import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function JobDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-24 bg-muted rounded" />

      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/3 bg-muted rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-6 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="h-5 w-28 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  );
}
