import Card, { CardImage, CardContent } from "@/components/ui/Card";

const mockProducts = [
  { id: 1, name: "Midnight Velvet Shirt", price: "Rs. 4,500" },
  { id: 2, name: "Obsidian Slim Trousers", price: "Rs. 5,200" },
  { id: 3, name: "Chrome Silk Fabric (2m)", price: "Rs. 3,800" },
  { id: 4, name: "Royal Black Sherwani", price: "Rs. 12,000" },
  { id: 5, name: "Ivory Classic Kurta", price: "Rs. 3,200" },
  { id: 6, name: "Slate Grey Waistcoat", price: "Rs. 6,500" },
  { id: 7, name: "Emerald Dinner Jacket", price: "Rs. 8,900" },
  { id: 8, name: "Pearl White Shalwar", price: "Rs. 2,800" },
];

export default function FeaturedCollection() {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <h2 className="font-display text-3xl tracking-[0.1em] text-foreground sm:text-4xl">
          Featured Pieces
        </h2>
        <div className="mt-3 h-px w-16 bg-chrome-400" />
      </div>

      {/* Horizontal scroll rail */}
      <div className="mt-10 overflow-x-auto scrollbar-hide">
        <div
          className="flex gap-5 px-4 pb-4 sm:px-6 lg:px-8"
          style={{
            paddingLeft:
              "max(1rem, calc((100vw - 80rem) / 2 + 2rem))",
          }}
        >
          {mockProducts.map((product) => (
            <a
              key={product.id}
              href="#"
              className="flex-shrink-0 w-56 sm:w-64"
            >
              <Card className="w-full">
                <CardImage>
                  <div
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
                    }}
                  />
                </CardImage>
                <CardContent>
                  <h3 className="font-body text-sm text-foreground group-hover:text-chrome-200 transition-colors duration-200">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-body text-sm text-muted">
                    {product.price}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
