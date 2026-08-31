import HeroSection from "@/components/home/HeroSection";
import CategoryCards from "@/components/home/CategoryCards";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import BrandStory from "@/components/home/BrandStory";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategoryCards />
      <FeaturedCollection />
      <BrandStory />
    </main>
  );
}
