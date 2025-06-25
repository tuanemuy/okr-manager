import { Suspense } from "react";
import SearchFiltersContainer from "@/components/search/SearchFiltersContainer";
import { SearchOkrs } from "@/components/search/SearchOkrs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">OKR検索</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Filters */}
        <div className="lg:col-span-1">
          <Suspense fallback={<SearchFiltersSkeleton />}>
            <SearchFiltersContainer />
          </Suspense>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchOkrs searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SearchFiltersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>フィルター</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function SearchResultsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>検索結果</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => i).map((index) => (
            <div
              key={`search-skeleton-${index}`}
              className="border rounded-lg p-4"
            >
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
