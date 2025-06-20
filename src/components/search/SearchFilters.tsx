"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFiltersProps {
  filters: {
    teams: Array<{ id: string; name: string }>;
    users: Array<{ id: string; displayName: string }>;
    years: number[];
    quarters: string[];
  };
}

export function SearchFilters({ filters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [teamId, setTeamId] = useState(searchParams.get("teamId") || "");
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [quarter, setQuarter] = useState(searchParams.get("quarter") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("query", query.trim());
    if (teamId) params.set("teamId", teamId);
    if (userId) params.set("userId", userId);
    if (quarter) params.set("quarter", quarter);
    if (year) params.set("year", year);

    params.set("page", "1"); // Reset to first page when filtering

    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    setTeamId("");
    setUserId("");
    setQuarter("");
    setYear("");
    router.push("/search");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Query */}
      <div>
        <Label htmlFor="query">Search Keywords</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="query"
            placeholder="Search OKRs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Team Filter */}
      <div>
        <Label htmlFor="team">Team</Label>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger>
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All teams</SelectItem>
            {filters.teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Filter */}
      <div>
        <Label htmlFor="user">Owner</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger>
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All members</SelectItem>
            {filters.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quarter Filter */}
      <div>
        <Label htmlFor="quarter">Quarter</Label>
        <Select value={quarter} onValueChange={setQuarter}>
          <SelectTrigger>
            <SelectValue placeholder="All quarters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All quarters</SelectItem>
            {filters.quarters.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year Filter */}
      <div>
        <Label htmlFor="year">Year</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All years</SelectItem>
            {filters.years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSearch} className="flex-1">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button onClick={handleClear} variant="outline">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
