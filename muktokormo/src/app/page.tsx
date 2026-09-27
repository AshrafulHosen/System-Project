"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import JobFeed from "@/components/JobFeed";
import FreelancerDirectory from "@/components/FreelancerDirectory";
import EscrowTrustBanner from "@/components/EscrowTrustBanner";
import PostJobModal from "@/components/PostJobModal";
import ProposalModal from "@/components/ProposalModal";
import EscrowModal from "@/components/EscrowModal";
import Footer from "@/components/Footer";
import { INITIAL_JOBS } from "@/data/mockData";
import { Job, JobCategory, ProposalSubmission } from "@/types";

export default function Home() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [proposalJob, setProposalJob] = useState<Job | null>(null);
  const [escrowJob, setEscrowJob] = useState<Job | null>(null);

  const handleToggleLang = () => {
    setLang((prev) => (prev === "en" ? "bn" : "en"));
  };

  const handleToggleRole = () => {
    setRole((prev) => (prev === "client" ? "freelancer" : "client"));
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    // Scroll to job feed smoothly
    const jobSection = document.getElementById("jobs-section");
    if (jobSection) {
      jobSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleProposalSubmitted = (submission: ProposalSubmission) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === submission.jobId
          ? { ...j, proposalsCount: j.proposalsCount + 1 }
          : j
      )
    );
  };

  const handleSelectSkill = (skill: string) => {
    setSearchQuery(skill);
    const jobSection = document.getElementById("jobs-section");
    if (jobSection) {
      jobSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleExploreJobs = () => {
    const jobSection = document.getElementById("jobs-section");
    if (jobSection) {
      jobSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHireDirect = (freelancerName: string) => {
    setIsPostJobOpen(true);
  };

  const handleOpenEscrowDefault = () => {
    setEscrowJob(jobs[0] || null);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        onOpenPostJob={() => setIsPostJobOpen(true)}
        lang={lang}
        onToggleLang={handleToggleLang}
        role={role}
        onToggleRole={handleToggleRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          lang={lang}
          onOpenPostJob={() => setIsPostJobOpen(true)}
          onSelectSkill={handleSelectSkill}
          onExploreJobs={handleExploreJobs}
        />

        {/* Categories Explorer */}
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          lang={lang}
        />

        {/* Live Marketplace Job Feed */}
        <JobFeed
          jobs={jobs}
          lang={lang}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSelectJobForProposal={(job) => setProposalJob(job)}
          onSelectJobForEscrow={(job) => setEscrowJob(job)}
          onOpenPostJob={() => setIsPostJobOpen(true)}
        />

        {/* Verified Freelancers Directory */}
        <FreelancerDirectory
          lang={lang}
          onHireDirect={handleHireDirect}
        />

        {/* Escrow Financial Safety Section */}
        <EscrowTrustBanner
          lang={lang}
          onOpenEscrowTest={handleOpenEscrowDefault}
        />
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Modals & Interactive Overlays */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
        lang={lang}
      />

      <ProposalModal
        job={proposalJob}
        isOpen={!!proposalJob}
        onClose={() => setProposalJob(null)}
        onSubmitProposal={handleProposalSubmitted}
        lang={lang}
      />

      <EscrowModal
        job={escrowJob}
        isOpen={!!escrowJob}
        onClose={() => setEscrowJob(null)}
        lang={lang}
      />

    </div>
  );
}
