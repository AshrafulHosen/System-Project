"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import JobFeed from "@/components/JobFeed";
import FreelancerDirectory from "@/components/FreelancerDirectory";
import EscrowTrustBanner from "@/components/EscrowTrustBanner";
import PostJobModal from "@/components/PostJobModal";
import BidModal from "@/components/BidModal";
import JobBidsModal from "@/components/JobBidsModal";
import MyBidsDrawer from "@/components/MyBidsDrawer";
import EscrowModal from "@/components/EscrowModal";
import Footer from "@/components/Footer";
import { INITIAL_JOBS } from "@/data/mockData";
import { INITIAL_BIDS } from "@/data/mockBids";
import { Job, JobCategory, ProposalSubmission, JobBid } from "@/types";

export default function Home() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [bids, setBids] = useState<JobBid[]>(INITIAL_BIDS);
  const [myBids, setMyBids] = useState<JobBid[]>(() =>
    INITIAL_BIDS.filter((b) => b.freelancerId === "fl-tanvir")
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Drawers
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [selectedBidJob, setSelectedBidJob] = useState<Job | null>(null);
  const [selectedJobForBids, setSelectedJobForBids] = useState<Job | null>(null);
  const [isMyBidsOpen, setIsMyBidsOpen] = useState(false);
  const [escrowJob, setEscrowJob] = useState<Job | null>(null);
  const [escrowCustomAmount, setEscrowCustomAmount] = useState<number | undefined>(undefined);
  const [escrowFreelancerName, setEscrowFreelancerName] = useState<string | undefined>(undefined);

  const handleToggleLang = () => {
    setLang((prev) => (prev === "en" ? "bn" : "en"));
  };

  const handleToggleRole = () => {
    setRole((prev) => (prev === "client" ? "freelancer" : "client"));
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    const jobSection = document.getElementById("jobs-section");
    if (jobSection) {
      jobSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Bid submission from Freelancer
  const handleSubmitBid = (submission: ProposalSubmission) => {
    const newBid: JobBid = {
      id: `bid-${Date.now()}`,
      jobId: submission.jobId,
      freelancerId: "fl-current-user",
      freelancerName: submission.freelancerName,
      freelancerTitle: submission.freelancerTitle || "Full-Stack Specialist",
      freelancerAvatar: submission.freelancerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      freelancerRating: 5.0,
      freelancerReviewsCount: 1,
      isNidVerified: true,
      bidAmountBdt: submission.bidAmountBdt,
      platformFeeBdt: submission.platformFeeBdt,
      netEarnedBdt: submission.netEarnedBdt,
      deliveryDays: submission.deliveryDays,
      biddingType: submission.biddingType || "PROJECT",
      milestones: submission.milestones,
      coverLetter: submission.coverLetter,
      portfolioLinks: submission.portfolioLinks,
      payoutMethod: submission.payoutMethod || "BKASH",
      payoutAccount: submission.phone,
      submittedAt: "Just now",
      status: "PENDING",
    };

    setBids((prev) => [newBid, ...prev]);
    setMyBids((prev) => [newBid, ...prev]);

    // Increment proposals count on job
    setJobs((prev) =>
      prev.map((j) =>
        j.id === submission.jobId
          ? { ...j, proposalsCount: j.proposalsCount + 1 }
          : j
      )
    );
  };

  // Toggle Shortlist status on a bid
  const handleToggleShortlist = (bidId: string) => {
    const updateBid = (b: JobBid) =>
      b.id === bidId
        ? { ...b, status: (b.status === "SHORTLISTED" ? "PENDING" : "SHORTLISTED") as JobBid["status"] }
        : b;

    setBids((prev) => prev.map(updateBid));
    setMyBids((prev) => prev.map(updateBid));
  };

  // Client accepts bid and launches Escrow lock
  const handleAcceptBidAndEscrow = (job: Job, bid: JobBid) => {
    // Mark bid as accepted
    const updateBid = (b: JobBid) =>
      b.id === bid.id ? { ...b, status: "ACCEPTED" as const } : b;

    setBids((prev) => prev.map(updateBid));
    setMyBids((prev) => prev.map(updateBid));

    // Close bids modal & launch Escrow modal with agreed bid amount
    setSelectedJobForBids(null);
    setEscrowJob(job);
    setEscrowCustomAmount(bid.bidAmountBdt);
    setEscrowFreelancerName(bid.freelancerName);
  };

  // Freelancer withdraws bid
  const handleWithdrawBid = (bidId: string) => {
    const bidToRemove = bids.find((b) => b.id === bidId);
    setBids((prev) => prev.filter((b) => b.id !== bidId));
    setMyBids((prev) => prev.filter((b) => b.id !== bidId));

    if (bidToRemove) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === bidToRemove.jobId
            ? { ...j, proposalsCount: Math.max(0, j.proposalsCount - 1) }
            : j
        )
      );
    }
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
    setEscrowCustomAmount(undefined);
    setEscrowFreelancerName(undefined);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        onOpenPostJob={() => setIsPostJobOpen(true)}
        lang={lang}
        onToggleLang={handleToggleLang}
        role={role}
        onToggleRole={handleToggleRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        myBidsCount={myBids.length}
        onOpenMyBids={() => setIsMyBidsOpen(true)}
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
          onSelectJobForProposal={(job) => setSelectedBidJob(job)}
          onViewJobBids={(job) => setSelectedJobForBids(job)}
          onSelectJobForEscrow={(job) => {
            setEscrowJob(job);
            setEscrowCustomAmount(undefined);
            setEscrowFreelancerName(undefined);
          }}
          onOpenPostJob={() => setIsPostJobOpen(true)}
          myBidsCount={myBids.length}
          onOpenMyBids={() => setIsMyBidsOpen(true)}
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

      {/* Post a Job Modal (Client Flow) */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
        lang={lang}
      />

      {/* Freelancer Place Bid Modal */}
      <BidModal
        job={selectedBidJob}
        isOpen={!!selectedBidJob}
        onClose={() => setSelectedBidJob(null)}
        onSubmitBid={handleSubmitBid}
        lang={lang}
      />

      {/* Job Bids Room Modal (Explore & Compare Bids for a Job) */}
      <JobBidsModal
        job={selectedJobForBids}
        bids={bids}
        isOpen={!!selectedJobForBids}
        onClose={() => setSelectedJobForBids(null)}
        onOpenBidModal={(job) => {
          setSelectedJobForBids(null);
          setSelectedBidJob(job);
        }}
        onAcceptBidAndEscrow={handleAcceptBidAndEscrow}
        onToggleShortlist={handleToggleShortlist}
        role={role}
        lang={lang}
      />

      {/* Freelancer My Bids Drawer */}
      <MyBidsDrawer
        isOpen={isMyBidsOpen}
        onClose={() => setIsMyBidsOpen(false)}
        myBids={myBids}
        jobs={jobs}
        onWithdrawBid={handleWithdrawBid}
        onViewJobBids={(job) => setSelectedJobForBids(job)}
        lang={lang}
      />

      {/* Escrow Milestone & Payment Modal */}
      <EscrowModal
        job={escrowJob}
        isOpen={!!escrowJob}
        onClose={() => {
          setEscrowJob(null);
          setEscrowCustomAmount(undefined);
          setEscrowFreelancerName(undefined);
        }}
        customAmount={escrowCustomAmount}
        freelancerName={escrowFreelancerName}
        lang={lang}
      />

    </div>
  );
}
