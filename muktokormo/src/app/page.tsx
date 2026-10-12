"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { fetchOpenJobs, createJob } from "@/lib/data/jobs";
import {
  fetchMyJobBids,
  fetchProposalsForJob,
  submitProposal,
  updateProposalStatus,
  withdrawProposal,
} from "@/lib/data/proposals";
import { Job, ProposalSubmission, JobBid } from "@/types";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const { freelancerId, clientId } = useCurrentUser();

  const [lang, setLang] = useState<"en" | "bn">("en");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<JobBid[]>([]);
  const [myBids, setMyBids] = useState<JobBid[]>([]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const liveJobs = await fetchOpenJobs(supabase);
      if (cancelled) return;
      setJobs(liveJobs);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!freelancerId) return;
    let cancelled = false;
    (async () => {
      const liveBids = await fetchMyJobBids(supabase, freelancerId);
      if (!cancelled) setMyBids(liveBids);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, freelancerId]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === "en" ? "bn" : "en"));
  };

  const handleJobCreated = async (newJob: Job) => {
    let created: Job | null = null;

    if (clientId) {
      created = await createJob(supabase, clientId, {
        title: newJob.title,
        titleBn: newJob.titleBn,
        description: newJob.description,
        descriptionBn: newJob.descriptionBn,
        category: newJob.category,
        jobType: newJob.jobType,
        experienceLevel: newJob.experienceLevel,
        budgetBdt: newJob.budgetBdt,
        timelineDays: newJob.deadlineDays,
        skills: newJob.skills,
      });
    }

    setJobs((prev) => [created ?? newJob, ...prev]);
    const jobSection = document.getElementById("jobs-section");
    if (jobSection) {
      jobSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Bid submission from Freelancer
  const handleSubmitBid = async (submission: ProposalSubmission) => {
    let newBid: JobBid | null = null;

    if (freelancerId) {
      newBid = await submitProposal(supabase, {
        jobId: submission.jobId,
        freelancerId,
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
      });
    }

    if (!newBid) {
      newBid = {
        id: `bid-${Date.now()}`,
        jobId: submission.jobId,
        freelancerId: freelancerId || "fl-current-user",
        freelancerName: submission.freelancerName,
        freelancerTitle: submission.freelancerTitle || "Full-Stack Specialist",
        freelancerAvatar:
          submission.freelancerAvatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
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
    }

    setBids((prev) => [newBid!, ...prev]);
    setMyBids((prev) => [newBid!, ...prev]);

    setJobs((prev) =>
      prev.map((j) =>
        j.id === submission.jobId
          ? { ...j, proposalsCount: j.proposalsCount + 1 }
          : j
      )
    );
  };

  // Toggle Shortlist status on a bid
  const handleToggleShortlist = async (bidId: string) => {
    let nextStatus: JobBid["status"] = "SHORTLISTED";
    const updateBid = (b: JobBid) => {
      if (b.id !== bidId) return b;
      nextStatus = b.status === "SHORTLISTED" ? "PENDING" : "SHORTLISTED";
      return { ...b, status: nextStatus };
    };

    setBids((prev) => prev.map(updateBid));
    setMyBids((prev) => prev.map(updateBid));

    await updateProposalStatus(supabase, bidId, nextStatus);
  };

  // Client accepts bid and launches Escrow lock
  const handleAcceptBidAndEscrow = (job: Job, bid: JobBid) => {
    const updateBid = (b: JobBid) =>
      b.id === bid.id ? { ...b, status: "ACCEPTED" as const } : b;

    setBids((prev) => prev.map(updateBid));
    setMyBids((prev) => prev.map(updateBid));

    void updateProposalStatus(supabase, bid.id, "ACCEPTED");

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

    void withdrawProposal(supabase, bidId);
  };

  const handleViewJobBids = async (job: Job) => {
    setSelectedJobForBids(job);
    const fetched = await fetchProposalsForJob(supabase, job.id);
    if (fetched.length === 0) return;
    setBids((prev) => [
      ...fetched,
      ...prev.filter((b) => b.jobId !== job.id),
    ]);
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

  const handleHireDirect = () => {
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
          onViewJobBids={handleViewJobBids}
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
        key={selectedBidJob?.id}
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
        lang={lang}
      />

      {/* Freelancer My Bids Drawer */}
      <MyBidsDrawer
        isOpen={isMyBidsOpen}
        onClose={() => setIsMyBidsOpen(false)}
        myBids={myBids}
        jobs={jobs}
        onWithdrawBid={handleWithdrawBid}
        onViewJobBids={handleViewJobBids}
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
