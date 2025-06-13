import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Logos from "@/components/Logos";
// import Testimonials from "@/components/Testimonials";
// import Pricing from "@/components/Pricing/Pricing";
// import FAQ from "@/components/FAQ";
// import Logos from "@/components/Logos";
// import Benefits from "@/components/Benefits/Benefits";
// import Container from "@/components/Container";
// import Section from "@/components/Section";
// import Stats from "@/components/Stats";
// import CTA from "@/components/CTA";

const HomePage = () => {
  return (
    
    <div>
      <Header />
      <Hero />
      <Logos />
      {/* <Container>
        <Benefits />

        <Section
          id="pricing"
          title="Pricing"
          description="Simple, transparent pricing. No surprises."
        >
          <Pricing />
        </Section>

        <Section
          id="testimonials"
          title="What Our Clients Say"
          description="Hear from those who have partnered with us."
        >
          <Testimonials />
        </Section>

        <FAQ />

        <Stats />

        <CTA />
      </Container> */}
      <Footer />
    </div>
  );
};

export default HomePage;
