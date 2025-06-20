import { Suspense } from "react";
import { getSearchFiltersAction } from "@/actions/search";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchOkrs } from "@/components/search/SearchOkrs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filtersResult = await getSearchFiltersAction();

  if (!filtersResult.success) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Search OKRs</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading search filters: {filtersResult.error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filters = filtersResult.data || {
    teams: [],
    users: [],
    years: [],
    quarters: [],
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search OKRs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchFilters filters={filters} />
            </CardContent>
          </Card>
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

function SearchResultsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
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
