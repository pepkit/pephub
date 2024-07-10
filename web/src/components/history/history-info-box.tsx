export const HistoryInfoBox = () => {
  return (
    <div
      className="position-absolute top-0 end-0"
      style={{
        zIndex: 1000,
      }}
    >
      <div className="bg-warning px-2 py-1 text-sm rounded rounded-top-0 rounded-end-0 ">Viewing history</div>
    </div>
  );
};
