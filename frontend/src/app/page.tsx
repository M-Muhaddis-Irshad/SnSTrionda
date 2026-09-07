import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import PromoCampaigns from "@/components/home/PromoCampaigns";
import CategoryCards from "@/components/home/CategoryCards";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import BrandStory from "@/components/home/BrandStory";

export const metadata: Metadata = {
  title: "Luxury Menswear & Made-to-Order Clothing",
  description:
    "Discover Trionda Wears — premium fabrics, tailored shirts, trousers & sherwanis crafted to order in Pakistan. Shop the new collection with nationwide delivery.",
};

export default function Home() {
  return (
    <main>
      <HeroSection />
      <PromoCampaigns />
      <CategoryCards />
      <FeaturedCollection />
      <BrandStory />
    </main>
  );
}
