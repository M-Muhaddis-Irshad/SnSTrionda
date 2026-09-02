import Link from "next/link";

export default function AccessoriesPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <h1 className="shop-page-heading">Accessories</h1>
        <div className="section-divider" />
        <div className="shop-empty-state">
          <p className="shop-empty-text">No accessories available yet.</p>
          <Link href="/shop" className="shop-browse-link">
            Browse all products
          </Link>
        </div>
      </div>
    </main>
  );
}
