"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import JobFeed from "@/components/JobFeed";
import FreelancerDirectory from "@/components/FreelancerDirectory";
import EscrowTrustBanner from "@/components/EscrowTrustBanner";
import PopularServicesSection from "@/components/home/PopularServicesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import PlatformStatsSection from "@/components/home/PlatformStatsSection";
import WhyMuktokormoSection from "@/components/home/WhyMuktokormoSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import TrustStrip from "@/components/home/TrustStrip";
import FeatureTrioSection from "@/components/home/FeatureTrioSection";
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
import { createContractFromProposal } from "@/lib/data/contracts";
import { isUuid } from "@/lib/payments/constants";
import { Job, ProposalSubmission, JobBid } from "@/types";
import { ArrowRight, Briefcase, UserPlus } from "lucide-react";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const { freelancerId, clientId } = useCurrentUser();

  const [lang, setLang] = useState<"en" | "bn">("en");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [freelancersCount, setFreelancersCount] = useState<number>(0);
  const [bids, setBids] = useState<JobBid[]>([]);
  const [myBids, setMyBids] = useState<JobBid[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [talentSearchQuery, setTalentSearchQuery] = useState<string>("");

  // Modals & Drawers
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [selectedBidJob, setSelectedBidJob] = useState<Job | null>(null);
  const [selectedJobForBids, setSelectedJobForBids] = useState<Job | null>(null);
  const [isMyBidsOpen, setIsMyBidsOpen] = useState(false);
  const [escrowJob, setEscrowJob] = useState<Job | null>(null);
  const [escrowContractId, setEscrowContractId] = useState<string | undefined>(
    undefined
  );
  const [escrowCustomAmount, setEscrowCustomAmount] = useState<number | undefined>(
    undefined
  );
  const [escrowFreelancerName, setEscrowFreelancerName] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingJobs(true);
      const liveJobs = await fetchOpenJobs(supabase);
      if (cancelled) return;
      setJobs(liveJobs);
      setIsLoadingJobs(false);
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

  const handleAcceptBidAndEscrow = async (job: Job, bid: JobBid) => {
    const updateBid = (b: JobBid) =>
      b.id === bid.id ? { ...b, status: "ACCEPTED" as const } : b;

    setBids((prev) => prev.map(updateBid));
    setMyBids((prev) => prev.map(updateBid));

    setSelectedJobForBids(null);
    setEscrowJob(job);
    setEscrowContractId(isUuid(bid.id) ? `ctr-${bid.id}` : undefined);
    setEscrowCustomAmount(bid.bidAmountBdt);
    setEscrowFreelancerName(bid.freelancerName);

    if (isUuid(bid.id)) {
      const updated = await updateProposalStatus(supabase, bid.id, "ACCEPTED");
      if (updated) {
        const contract = await createContractFromProposal(supabase, bid.id);
        if (contract?.id) {
          setEscrowContractId(contract.id);
        }
      }
    }
  };

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
    setBids((prev) => [...fetched, ...prev.filter((b) => b.jobId !== job.id)]);
  };

  const handleSelectSkill = (skill: string) => {
    setSearchQuery(skill);
    const jobSection = document.getElementById("jobs-section");
    if (jobSection) {
      jobSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchTalent = (query: string) => {
    setTalentSearchQuery(query);
    const talentSection = document.getElementById("freelancers-section");
    if (talentSection) {
      talentSection.scrollIntoView({ behavior: "smooth" });
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
    setEscrowContractId(undefined);
    setEscrowCustomAmount(undefined);
    setEscrowFreelancerName(undefined);
  };

  const handleFreelancersLoaded = useCallback((count: number) => {
    setFreelancersCount(count);
  }, []);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink flex flex-col">
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

      <main className="flex-1">
        {/* Hero */}
        <HeroSection
          lang={lang}
          onOpenPostJob={() => setIsPostJobOpen(true)}
          onSelectSkill={handleSelectSkill}
          onSearchTalent={handleSearchTalent}
          onExploreJobs={handleExploreJobs}
          liveStats={{
            openJobsCount: jobs.length,
            freelancersCount,
          }}
        />

        {/* Trust & credibility strip */}
        <TrustStrip lang={lang} />

        {/* Specialized Categories */}
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          lang={lang}
          jobs={jobs}
          onOpenPostJob={() => setIsPostJobOpen(true)}
        />

        {/* Popular Services */}
        <PopularServicesSection
          lang={lang}
          onSelectServiceQuery={handleSelectSkill}
          onOpenPostJob={() => setIsPostJobOpen(true)}
        />

        {/* Live Marketplace Job Feed */}
        <JobFeed
          jobs={jobs}
          isLoading={isLoadingJobs}
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
          key={talentSearchQuery}
          lang={lang}
          onHireDirect={handleHireDirect}
          externalSearchQuery={talentSearchQuery}
          onLoadedCount={handleFreelancersLoaded}
        />

        {/* Feature trio */}
        <FeatureTrioSection lang={lang} onSearchTalent={handleSearchTalent} />

        {/* How MuktoKormo Works */}
        <HowItWorksSection lang={lang} showPageLink />

        {/* Platform Statistics Band (live counts only) */}
        <PlatformStatsSection
          lang={lang}
          openJobsCount={jobs.length}
          freelancersCount={freelancersCount}
        />

        {/* Escrow Financial Safety */}
        <EscrowTrustBanner
          lang={lang}
          onOpenEscrowTest={handleOpenEscrowDefault}
        />

        {/* Why MuktoKormo */}
        <WhyMuktokormoSection lang={lang} />

        {/* Platform commitments */}
        <TestimonialsSection lang={lang} />

        {/* Final Conversion CTA */}
        <section className="bg-white pb-20 sm:pb-24">
          <div className="mk-container">
            <div className="relative overflow-hidden rounded-3xl bg-brand text-white px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
              <div aria-hidden="true" className="absolute inset-0 mk-hatch-dark opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                <div className="lg:col-span-8">
                  <span className="mk-eyebrow text-white/70">
                    {lang === "en" ? "Built for Bangladesh's digital economy" : "বাংলাদেশের ডিজিটাল অর্থনীতির জন্য নির্মিত"}
                  </span>
                  <h2 className="mk-h2 mt-4 text-white max-w-[18ch]">
                    {lang === "en"
                      ? "Work beautifully. Build confidently."
                      : "সুন্দরভাবে কাজ করুন। আত্মবিশ্বাসের সাথে গড়ুন।"}
                  </h2>
                  <p className="mt-5 text-base text-white/80 leading-relaxed max-w-xl">
                    {lang === "en"
                      ? "Whether you are commissioning software and design sprints or offering specialised skills, MuktoKormo keeps contracts, milestones and settlements structured."
                      : "দক্ষ ফ্রিল্যান্সার নিয়োগ দিন অথবা আপনার দক্ষতা দিয়ে আয় শুরু করুন — সবকিছুই এক প্ল্যাটফর্মে।"}
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPostJobOpen(true)}
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-white hover:bg-brand-soft text-navy font-medium text-[15px] transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" aria-hidden="true" />
                    {lang === "en" ? "Post a project" : "কাজ পোস্ট করুন"}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-navy/40 hover:bg-navy/60 border border-white/25 text-white font-medium text-[15px] transition-colors"
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    {lang === "en" ? "Create a free account" : "ফ্রি অ্যাকাউন্ট খুলুন"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />

      {/* Modals & Drawers */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
        lang={lang}
      />

      <BidModal
        key={selectedBidJob?.id}
        job={selectedBidJob}
        isOpen={!!selectedBidJob}
        onClose={() => setSelectedBidJob(null)}
        onSubmitBid={handleSubmitBid}
        lang={lang}
      />

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

      <MyBidsDrawer
        isOpen={isMyBidsOpen}
        onClose={() => setIsMyBidsOpen(false)}
        myBids={myBids}
        jobs={jobs}
        onWithdrawBid={handleWithdrawBid}
        onViewJobBids={handleViewJobBids}
        lang={lang}
      />

      <EscrowModal
        job={escrowJob}
        contractId={escrowContractId}
        isOpen={!!escrowJob}
        onClose={() => {
          setEscrowJob(null);
          setEscrowContractId(undefined);
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
