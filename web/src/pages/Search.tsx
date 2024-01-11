import { FC, Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { SearchBar } from '../components/search/search-bar';
import { SearchLoading } from '../components/search/search-loading';
import { NamespaceSearchResults, ProjectSearchResults } from '../components/search/search-results';
import { LoadingSpinner } from '../components/spinners/loading-spinner';
import { useSearch } from '../hooks/queries/useSearch';
import { useDebounce } from '../hooks/useDebounce';

const RESULTS_PER_PAGE = 20;

export const SearchPage: FC = () => {
  // search params
  const [searchParams, setSearchParams] = useSearchParams();

  // state
  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [offset, setOffset] = useState(searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0);
  const searchDebounced = useDebounce<string>(search, 500);

  const {
    data: searchResults,
    isFetching: isSearching,
    refetch,
  } = useSearch({
    limit: RESULTS_PER_PAGE,
    q: searchDebounced,
    offset,
    autoRun: false,
  });

  const runSearch = () => {
    setSearchParams({ query: search, offset: offset.toString() });
    refetch();
  };

  useEffect(() => {
    // run search on mount (when the user navigates to this page from a link someone copied)
    setTimeout(() => {
      if (!!searchDebounced) {
        runSearch();
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (!!searchDebounced) {
      runSearch();
    }
  }, [offset]);

  return (
    <PageLayout title="Search">
      <div className="mt-3 border border-2 border-dark rounded p-2 shadow">
        <div className="d-flex flex-row align-items-center">
          <SearchBar onSearch={() => runSearch()} value={search} setValue={setSearch} />
          <div className="d-flex align-items-center">
            <button
              className="d-flex align-items-center btn btn-md btn-success py-2 ms-1"
              disabled={isSearching}
              onClick={() => runSearch()}
            >
              {isSearching && <LoadingSpinner className="w-4 h-4 spin me-1 fill-light" />}
              Search
            </button>
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
                  total={searchResults.total}
                  limit={RESULTS_PER_PAGE}
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
