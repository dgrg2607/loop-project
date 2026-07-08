export default function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null;
  const goTo = (p) => { if (p >= 1 && p <= pages) onChange(p); };

  return (
    <div className="pagination">
      <span className="pagination-summary">Page {page} of {pages} · {total} results</span>
      <div className="pagination-controls">
        <button className="btn-ghost" onClick={() => goTo(page - 1)} disabled={page <= 1}>← Prev</button>
        <button className="btn-ghost" onClick={() => goTo(page + 1)} disabled={page >= pages}>Next →</button>
      </div>
    </div>
  );
}
