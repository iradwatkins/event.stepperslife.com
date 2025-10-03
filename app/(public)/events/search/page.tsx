'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  Calendar,
  MapPin,
  DollarSign,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface SearchResults {
  events: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  facets: {
    categories: Array<{ name: string; slug: string; count: number }>;
    priceRanges: Array<{ label: string; min: number; max: number }>;
    locations: Array<{ city: string; state: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
}

function EventSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search parameters
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  useEffect(() => {
    performSearch();
  }, [page]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);
      if (priceMin) params.append('priceMin', priceMin);
      if (priceMax) params.append('priceMax', priceMax);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (location) params.append('location', location);
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/events/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    performSearch();
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setPriceMin('');
    setPriceMax('');
    setDateFrom('');
    setDateTo('');
    setLocation('');
    setSortBy('date');
    setPage(1);
  };

  const activeFilterCount = [query, category, priceMin, priceMax, dateFrom, dateTo, location]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Search Events</h1>
              <p className="text-sm text-gray-600">
                {results ? `${results.pagination.total} events found` : 'Loading...'}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/events">← Back to Events</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear ({activeFilterCount})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Query */}
                <form onSubmit={handleSearch} className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Keywords..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">All Categories</option>
                    {results?.facets.categories.map((cat) => (
                      <option key={cat.slug} value={cat.name}>
                        {cat.name} ({cat.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min $"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      min="0"
                    />
                    <Input
                      type="number"
                      placeholder="Max $"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="City or State"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Apply Filters Button */}
                <Button onClick={() => { setPage(1); performSearch(); }} className="w-full">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            {/* Popular Locations */}
            {results && results.facets.locations.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Popular Locations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {results.facets.locations.slice(0, 5).map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLocation(`${loc.city}, ${loc.state}`);
                        setPage(1);
                        performSearch();
                      }}
                      className="w-full text-left text-sm text-gray-600 hover:text-primary transition-colors"
                    >
                      {loc.city}, {loc.state} ({loc.count})
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Sort and View Options */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Label className="text-sm">Sort by:</Label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                    performSearch();
                  }}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="date">Date (Soonest)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="popularity">Most Popular</option>
                  <option value="created">Newest</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            )}

            {/* No Results */}
            {!loading && results && results.events.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </CardContent>
              </Card>
            )}

            {/* Results Grid */}
            {!loading && results && results.events.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {results.events.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold line-clamp-2 mb-2">{event.name}</h3>
                            <div className="flex flex-wrap gap-2">
                              {event.categories.map((cat: any) => (
                                <Badge key={cat.slug} variant="outline" className="text-xs">
                                  {cat.name}
                                </Badge>
                              ))}
                              {event.capacity.selloutRisk && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  Almost Sold Out!
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">
                            {event.venue.city}, {event.venue.state}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {event.pricing.isFree ? 'Free' : `From $${event.pricing.minPrice.toFixed(2)}`}
                          </span>
                        </div>

                        {event.shortDescription && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.shortDescription}
                          </p>
                        )}

                        <Button asChild className="w-full mt-4">
                          <Link href={`/events/${event.id}`}>
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {results.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={!results.pagination.hasPrevPage}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {results.pagination.page} of {results.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!results.pagination.hasNextPage}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EventSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <EventSearchContent />
    </Suspense>
  );
}
