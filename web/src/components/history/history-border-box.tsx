export const HistoryBorderBox = () => {
  return (
    <div
      className="position-absolute viewing-history-border border-warning"
      style={{
        height: '100vh',
        width: '100vw',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    ></div>
  );
};
