export const SearchLoading = () => {
  return (
    <div className="d-block">
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
        <img className="bounce" src="/pep-dark.svg" height="75" />
        <p className="text-muted">Searching database...</p>
      </div>
    </div>
  );
};
