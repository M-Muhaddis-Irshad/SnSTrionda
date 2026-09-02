import Link from "next/link";

export default function FootwearPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <h1 className="shop-page-heading">Footwear</h1>
        <div className="section-divider" />
        <div className="shop-empty-state">
          <p className="shop-empty-text">No footwear products available yet.</p>
          <Link href="/shop" className="shop-browse-link">
            Browse all products
          </Link>
        </div>
      </div>
    </main>
  );
}
