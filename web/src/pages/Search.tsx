import { FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SearchResult } from '../api/search';
import { PageLayout } from '../components/layout/page-layout';
import { SearchOptionsModal } from '../components/modals/search-options';
import { SearchBar } from '../components/search/search-bar';
import { SearchLoading } from '../components/search/search-loading';
import { NamespaceSearchResults, ProjectSearchResults } from '../components/search/search-results';
import { useSearch } from '../hooks/queries/useSearch';
import { useDebounce } from '../hooks/useDebounce';
import { useSession } from '../hooks/useSession';

export const SearchPage: FC = () => {
  const { jwt } = useSession();

  // search params
  const [searchParams, setSearchParams] = useSearchParams();

  // state
  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [scoreThreshold, setScoreThreshold] = useState(
    searchParams.get('scorThreshold') ? parseFloat(searchParams.get('scoreThreshold')!) : 0.25,
  );
  const [limit, setLimit] = useState(searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10);
  const [offset, setOffset] = useState(searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0);
  const [showSearchOptionsModal, setShowSearchOptionsModal] = useState(false);

  const {
    data: searchResults,
    isFetching,
    refetch: refetchSearch,
    isFetched,
  } = useSearch(search, limit, offset, scoreThreshold, jwt, false);

  const runSearch = () => {
    setSearchParams({ query: search, limit: limit.toString(), offset: offset.toString() });
    refetchSearch();
  };

  // run refetch on page load
  useEffect(() => {
    if (search) {
      refetchSearch();
    }
  }, []);

  return (
    <PageLayout title="Search">
      <div className="d-flex flex-row align-items-center mt-2">
        <SearchBar onSearch={() => runSearch()} value={search} setValue={setSearch} />
        <button className="py-2 btn btn-outline-dark border border-2 border-dark ms-2">
          <i className="bi bi-search"></i>
        </button>
        <button
          className="py-2 btn btn-outline-dark border border-2 border-dark ms-2"
          onClick={() => setShowSearchOptionsModal(true)}
        >
          <i className="bi bi-sliders"></i>
        </button>
      </div>
      <div className="mt-3 d-flex flex-column" style={{ minHeight: '50vh' }}>
        {isFetching && <SearchLoading />}
        {isFetched && searchResults && (
          <>
            <NamespaceSearchResults hits={searchResults.namespace_hits} />
            <ProjectSearchResults hits={searchResults.results} />
          </>
        )}
      </div>
      <SearchOptionsModal
        scoreThreshold={scoreThreshold}
        setScoreThreshold={setScoreThreshold}
        limit={limit}
        setLimit={setLimit}
        offset={offset}
        setOffset={setOffset}
        show={showSearchOptionsModal}
        onHide={() => setShowSearchOptionsModal(false)}
        onSearch={() => runSearch()}
      />
    </PageLayout>
  );
  runSearch;
};
