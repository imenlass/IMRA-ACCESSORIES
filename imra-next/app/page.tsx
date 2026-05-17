import { Suspense } from 'react';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Features from '@/components/Features';
import ProductsSection from '@/components/ProductsSection';
import ProductsSkeleton from '@/components/ProductsSkeleton';
import Collections from '@/components/Collections';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Features />
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsSection />
      </Suspense>
      <Collections />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}
