import { useQueryClient } from '@tanstack/react-query';
import { FC, Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { SearchBar } from '../components/search/search-bar';
import { SearchLoading } from '../components/search/search-loading';
import { NamespaceSearchResults, ProjectSearchResults } from '../components/search/search-results';
import { LoadingSpinner } from '../components/spinners/loading-spinner';
import { useSearch } from '../hooks/queries/useSearch';
import { useDebounce } from '../hooks/useDebounce';

export const SearchPage: FC = () => {
  // search params
  const [searchParams, setSearchParams] = useSearchParams();

  // query client
  const queryClient = useQueryClient();

  const resetSearch = () => {
    queryClient.removeQueries({
      queryKey: ['search'],
    });
    setScoreThreshold(0.5);
    setLimit(10);
    setOffset(0);
    setSearchParams({});
    setSearch('');
  };

  // state
  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [scoreThreshold, setScoreThreshold] = useState(
    searchParams.get('scoreThreshold') ? parseFloat(searchParams.get('scoreThreshold')!) : 0.5,
  );
  const [limit, setLimit] = useState(searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10);
  const [offset, setOffset] = useState(searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0);
  const searchDebounced = useDebounce<string>(search, 500);

  const {
    data: searchResults,
    isFetching: isSearching,
    refetch,
  } = useSearch({
    q: searchDebounced,
    scoreThreshold,
    limit,
    offset,
    autoRun: true,
  });

  const runSearch = () => {
    setSearchParams({ query: search, offset: offset.toString(), scoreThreshold: scoreThreshold.toString() });
    refetch();
  };

  useEffect(() => {
    setTimeout(() => {
      if (searchDebounced !== '') {
        runSearch();
      }
    }, 500);
  }, []);

  return (
    <PageLayout title="Search">
      <div className="mt-3 border border-2 border-dark rounded p-2 shadow">
        <div className="d-flex flex-row align-items-center">
          <SearchBar onSearch={() => runSearch()} value={search} setValue={setSearch} />
        </div>
        <div className="d-flex align-items-end gap-2 mt-2 justify-content-between">
          <div className="d-flex align-items-end gap-2">
            <button className="btn btn-md btn-success" disabled={isSearching} onClick={() => runSearch()}>
              {isSearching && <LoadingSpinner className="w-4 h-4 spin me-1 mb-tiny fill-light" />}
              Search
            </button>
            <button
              className="btn btn-md btn-outline-dark"
              onClick={() => {
                resetSearch();
              }}
            >
              Reset
            </button>
          </div>
          <div className="d-flex align-items-start gap-3">
            <div className="d-flex flex-column align-items-start">
              <label className="form-label fw-bold text-sm mb-0">No. results</label>
              <select className="form-control py-1" onChange={(e) => setLimit(parseInt(e.target.value))} value={limit}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="d-flex flex-column align-items-start">
              <label className="form-label fw-bold text-sm mb-0">
                Score threshold
                <span className="ms-1">({scoreThreshold})</span>
              </label>
              <input
                onChange={(e) => setScoreThreshold(Number((parseFloat(e.target.value) / 100).toFixed(2)))}
                value={scoreThreshold * 100}
                type="range"
                className="form-range mt-1"
                id="score-threshold"
              ></input>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 d-flex flex-column" style={{ minHeight: '50vh' }}>
        {isSearching ? (
          <SearchLoading />
        ) : (
          <Fragment>
            {searchResults && !isSearching ? (
              <Fragment>
                <NamespaceSearchResults hits={searchResults.namespace_hits} />
                <ProjectSearchResults
                  numResultsPerPage={limit}
                  offset={offset}
                  setOffset={setOffset}
                  hits={searchResults.results}
                />
              </Fragment>
            ) : (
              <Fragment>
                {!searchResults && (
                  <div className="d-flex flex-column align-items-center justify-content-center mt-5">
                    <p className="text-muted fst-italic">Try searching for some projects!</p>
                  </div>
                )}
              </Fragment>
            )}
          </Fragment>
        )}
      </div>
    </PageLayout>
  );
};
