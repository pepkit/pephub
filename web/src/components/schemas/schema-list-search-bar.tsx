type Props = {
  value: string;
  setValue?: (value: string) => void;
};

export const SchemaListSearchBar = (props: Props) => {
  const { value, setValue } = props;

  return (
    <div className="flex-row d-flex align-items-center" style={{ position: 'relative' }}>
      <div className="input-group shadow-sm">
        <span id="search-bar-label" className="input-group-text">
          Search
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search schemas..."
          value={value}
          onChange={(e) => setValue && setValue(e.target.value)}
        />
      </div>
    </div>
  );
};
