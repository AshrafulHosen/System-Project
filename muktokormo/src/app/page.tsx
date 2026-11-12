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
import { ArrowRight, Briefcase, UserPlus, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#111315] flex flex-col selection:bg-[#0F6E50] selection:text-white">
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

        {/* Platform Statistics Band */}
        <PlatformStatsSection
          lang={lang}
          openJobsCount={jobs.length}
          freelancersCount={freelancersCount}
        />

        {/* Specialized Categories */}
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          lang={lang}
          jobs={jobs}
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

        {/* How MuktoKormo Works */}
        <HowItWorksSection lang={lang} />

        {/* Why MuktoKormo */}
        <WhyMuktokormoSection lang={lang} />

        {/* Escrow Financial Safety Banner */}
        <EscrowTrustBanner
          lang={lang}
          onOpenEscrowTest={handleOpenEscrowDefault}
        />

        {/* Customer Testimonials */}
        <TestimonialsSection lang={lang} />

        {/* Final Conversion CTA Section */}
        <section className="py-18 bg-[#FAF9F6] border-t border-[rgba(17,19,21,0.08)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mk-dark-card p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full bg-[#0F6E50]/35 blur-3xl pointer-events-none" />

              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7CE0B8]/12 border border-[#7CE0B8]/25 text-[#7CE0B8] text-[11px] font-semibold mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {lang === "en"
                      ? "Built for Bangladesh's Digital Economy"
                      : "বাংলাদেশের ডিজিটাল অর্থনীতির জন্য নির্মিত"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                  {lang === "en" ? (
                    <>
                      Start your next project with full{" "}
                      <span className="font-serif italic font-normal text-[#7CE0B8]">
                        BDT escrow
                      </span>{" "}
                      confidence.
                    </>
                  ) : (
                    "শতভাগ বিডিটি এসক্রো নিরাপত্তায় আপনার পরবর্তী প্রজেক্ট শুরু করুন।"
                  )}
                </h2>
                <p className="mt-3 text-sm text-white/75 leading-relaxed">
                  {lang === "en"
                    ? "Whether you are commissioning software and design sprints or offering specialized skills, MuktoKormo keeps contracts, milestones, and settlements structured."
                    : "দক্ষ ফ্রিল্যান্সার নিয়োগ দিন অথবা আপনার দক্ষতা দিয়ে আয় শুরু করুন — সবকিছুই এক প্ল্যাটফর্মে।"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 relative z-10">
                <button
                  type="button"
                  onClick={() => setIsPostJobOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0F6E50] hover:bg-[#0B5940] text-white font-semibold text-sm transition-all cursor-pointer shadow-[0_8px_20px_-6px_rgba(15,110,80,0.5)]"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{lang === "en" ? "Post a Project" : "কাজ পোস্ট করুন"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 text-white font-semibold text-sm transition-all"
                >
                  <UserPlus className="w-4 h-4 text-[#7CE0B8]" />
                  <span>
                    {lang === "en" ? "Create Free Account" : "ফ্রি অ্যাকাউন্ট খুলুন"}
                  </span>
                </Link>
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
