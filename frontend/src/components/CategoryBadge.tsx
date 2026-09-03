// CategoryBadge — small chrome-outline chip showing a product's category.
// Used on the homepage featured grid; safe to reuse anywhere.

export default function CategoryBadge({ label }: { label: string }) {
  return <span className="product-card-category-badge">{label}</span>;
}
