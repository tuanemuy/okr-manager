import { getSearchFiltersAction } from "@/actions/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchFilters } from "./SearchFilters";

export default async function SearchFiltersContainer() {
  const filtersResult = await getSearchFiltersAction();

  if (!filtersResult.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">
            フィルターの読み込みに失敗しました
          </p>
        </CardContent>
      </Card>
    );
  }

  const filters = filtersResult.data || {
    teams: [],
    users: [],
    years: [],
    quarters: [],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>フィルター</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchFilters filters={filters} />
      </CardContent>
    </Card>
  );
}
