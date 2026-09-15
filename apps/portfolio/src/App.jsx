import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TerminalSnippet from './components/TerminalSnippet';
import ArchitectureShowcase from './components/ArchitectureShowcase';
import SkillsMatrix from './components/SkillsMatrix';
import FeaturedProjects from './components/FeaturedProjects';
import ExperienceTimeline from './components/ExperienceTimeline';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

function PortfolioContent() {
  return (
    <div className="portfolio-app">
      <Navbar />
      <main className="main-content">
        <Hero />
        <TerminalSnippet />
        <ArchitectureShowcase />
        <SkillsMatrix />
        <FeaturedProjects />
        <ExperienceTimeline />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PortfolioContent />
    </ThemeProvider>
  );
}
