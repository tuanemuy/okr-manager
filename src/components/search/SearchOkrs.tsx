import { CalendarDays, Target, Users } from "lucide-react";
import Link from "next/link";
import { searchOkrsAction } from "@/actions/search";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SearchPagination } from "./SearchPagination";

interface SearchOkrsProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function SearchOkrs({ searchParams }: SearchOkrsProps) {
  const query = (searchParams.query as string) || "";
  const teamId = searchParams.teamId as string;
  const userId = searchParams.userId as string;
  const quarter = searchParams.quarter as string;
  const year = searchParams.year
    ? Number.parseInt(searchParams.year as string)
    : undefined;
  const page = Number.parseInt(searchParams.page as string) || 1;

  const result = await searchOkrsAction({
    query,
    teamId,
    userId,
    quarter,
    year,
    page,
    limit: 10,
  });

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">
            Error loading search results: {result.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { items: okrs, totalCount } = result.data || {
    items: [],
    totalCount: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>検索結果</span>
          <Badge variant="secondary">{totalCount} 件</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {okrs.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              OKRが見つかりません
            </h3>
            <p className="text-gray-500">
              検索キーワードやフィルターを調整してみてください。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {okrs.map((okr) => (
              <Link
                key={okr.id}
                href={`/teams/${okr.teamId}/okrs/${okr.id}`}
                className="block"
              >
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {okr.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{okr.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge
                        variant={okr.type === "team" ? "default" : "secondary"}
                      >
                        {okr.type === "team" ? "チーム" : "個人"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    {/* Team Info */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{okr.teamName}</span>
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-2" />
                      <span>{okr.ownerName}</span>
                    </div>

                    {/* Period Info */}
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      <span>
                        Q{okr.quarterQuarter} {okr.quarterYear}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">全体進捗</span>
                      <span className="font-medium">
                        {Math.round(okr.progress)}%
                      </span>
                    </div>
                    <Progress value={okr.progress} className="h-2" />
                  </div>

                  {/* Key Results Preview */}
                  {okr.keyResults && okr.keyResults.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        キーリザルト ({okr.keyResults.length})
                      </h4>
                      <div className="space-y-1">
                        {okr.keyResults.slice(0, 2).map((kr) => (
                          <div
                            key={kr.id}
                            className="text-xs text-gray-600 flex items-center justify-between"
                          >
                            <span className="truncate flex-1 mr-2">
                              {kr.title}
                            </span>
                            <span className="whitespace-nowrap">
                              {kr.currentValue}/{kr.targetValue} {kr.unit}
                            </span>
                          </div>
                        ))}
                        {okr.keyResults.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{okr.keyResults.length - 2} 件のキーリザルト
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalCount > 10 && (
          <div className="mt-6">
            <SearchPagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={10}
              searchParams={searchParams}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
