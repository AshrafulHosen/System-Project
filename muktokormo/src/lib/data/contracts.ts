import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceContract, WorkspaceMilestone, ContractActivity } from "@/types";
import { INITIAL_WORKSPACE_CONTRACTS } from "@/data/mockContracts";

const CONTRACTS_STORAGE_KEY = "muktokormo_contracts_store_v2";

function getLocalStore(): WorkspaceContract[] {
  if (typeof window === "undefined") return INITIAL_WORKSPACE_CONTRACTS;
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(INITIAL_WORKSPACE_CONTRACTS));
      return INITIAL_WORKSPACE_CONTRACTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_WORKSPACE_CONTRACTS;
  } catch {
    return INITIAL_WORKSPACE_CONTRACTS;
  }
}

function saveLocalStore(contracts: WorkspaceContract[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  } catch (err) {
    console.error("Failed to save local contracts store:", err);
  }
}

export function mapRowToWorkspaceContract(row: any): WorkspaceContract {
  const proposal = Array.isArray(row.proposals) ? row.proposals[0] : (row.proposals || row.proposal);
  const project = Array.isArray(proposal?.projects) ? proposal?.projects[0] : (proposal?.projects || proposal?.project);
  const client = Array.isArray(project?.clients) ? project?.clients[0] : (project?.clients || project?.client);
  const freelancer = Array.isArray(proposal?.freelancers) ? proposal?.freelancers[0] : (proposal?.freelancers || proposal?.freelancer);
  const milestonesRaw = Array.isArray(proposal?.proposal_milestones) ? proposal.proposal_milestones : [];

  const milestones: WorkspaceMilestone[] = milestonesRaw.map((m: any, idx: number) => ({
    id: m.id || `ms-${idx + 1}`,
    order: m.sort_order || idx + 1,
    title: m.title || `Milestone ${idx + 1}`,
    description: m.description || `Deliverable phase for milestone ${idx + 1}`,
    amountBdt: m.amount_bdt || Math.round((row.total_amount || 40000) / (milestonesRaw.length || 1)),
    dueDate: m.delivery_days ? `${m.delivery_days} days` : row.end_date || "2026-11-01",
    status: idx === 0 ? "IN_PROGRESS" : "LOCKED_IN_ESCROW",
  }));

  const totalBdt = Number(row.total_amount || proposal?.bid_amount || 40000);
  const platformFeePct = 7;
  const netEarningsBdt = Math.round(totalBdt * 0.93);

  return {
    id: row.id,
    contractCode: `MK-CTR-${String(row.id).slice(0, 6).toUpperCase()}`,
    jobId: project?.id || proposal?.project_id || "job-1",
    proposalId: row.proposal_id || proposal?.id || undefined,
    title: project?.title || "Contract Engagement",
    titleBn: project?.title_bn || project?.title || "চুক্তি",
    category: (project?.category || "Web & App Development") as any,
    client: {
      id: client?.id || project?.client_id || undefined,
      userId: client?.user_id || undefined,
      name: client?.display_name || client?.company_name || "Verified Client",
      company: client?.company_name || "SME Enterprise BD",
      location: client?.location || "Dhaka, Bangladesh",
      avatar: client?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      rating: client?.rating || 4.9,
      isVerified: client?.is_verified ?? true,
    },
    freelancer: {
      id: freelancer?.id || proposal?.freelancer_id || undefined,
      userId: freelancer?.user_id || undefined,
      name: freelancer?.display_name || "Freelancer Partner",
      title: freelancer?.title || "Senior Software Engineer",
      avatar: freelancer?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: freelancer?.rating || 4.95,
      isNidVerified: freelancer?.is_nid_verified ?? true,
      phone: "+8801712-345678",
      payoutMethod: "BKASH",
      payoutAccount: proposal?.payout_account || "+8801712-345678",
    },
    totalBdt,
    platformFeePct,
    netEarningsBdt,
    escrowHeldBdt: Math.round(totalBdt * 0.5),
    releasedBdt: 0,
    remainingBdt: totalBdt,
    startedAt: row.start_date || "Just now",
    deadlineDate: row.end_date || "Nov 2, 2026",
    stage: ((row.status || "active").toUpperCase()) as any,
    milestones: milestones.length > 0 ? milestones : INITIAL_WORKSPACE_CONTRACTS[0].milestones,
    activityLogs: [
      {
        id: `act-${Date.now()}`,
        timestamp: "Just now",
        actor: "System Escrow",
        actorRole: "ESCROW_GATEWAY",
        action: "Contract Initialized & Escrow Locked",
        details: "Milestone funds secured in MuktoKormo BDT Escrow.",
        badgeType: "ESCROW",
        trxId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    ],
  };
}

export function mapProposalToContract(prop: any): WorkspaceContract {
  const project = Array.isArray(prop?.projects) ? prop?.projects[0] : (prop?.projects || prop?.project);
  const client = Array.isArray(project?.clients) ? project?.clients[0] : (project?.clients || project?.client);
  const freelancer = Array.isArray(prop?.freelancers) ? prop?.freelancers[0] : (prop?.freelancers || prop?.freelancer);
  const totalBdt = Number(prop.bid_amount || 40000);

  return {
    id: `ctr-${prop.id}`,
    contractCode: `MK-CTR-${String(prop.id).slice(0, 6).toUpperCase()}`,
    jobId: project?.id || prop.project_id || "job-1",
    proposalId: prop.id,
    title: project?.title || "Contract Engagement",
    titleBn: project?.title_bn || project?.title || "চুক্তি",
    category: (project?.category || "Web & App Development") as any,
    client: {
      id: client?.id || project?.client_id || undefined,
      userId: client?.user_id || undefined,
      name: client?.display_name || client?.company_name || "Verified Client",
      company: client?.company_name || "SME Enterprise BD",
      location: client?.location || "Dhaka, Bangladesh",
      avatar: client?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      rating: client?.rating || 4.9,
      isVerified: client?.is_verified ?? true,
    },
    freelancer: {
      id: freelancer?.id || prop.freelancer_id || undefined,
      userId: freelancer?.user_id || undefined,
      name: freelancer?.display_name || "Freelancer Partner",
      title: freelancer?.title || "Specialist",
      avatar: freelancer?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: freelancer?.rating || 4.95,
      isNidVerified: freelancer?.is_nid_verified ?? true,
      phone: "+8801712-345678",
      payoutMethod: "BKASH",
      payoutAccount: prop.payout_account || "",
    },
    totalBdt,
    platformFeePct: 7,
    netEarningsBdt: Math.round(totalBdt * 0.93),
    escrowHeldBdt: Math.round(totalBdt * 0.5),
    releasedBdt: 0,
    remainingBdt: totalBdt,
    startedAt: "Just now",
    deadlineDate: "30 days",
    stage: "ACTIVE",
    milestones: INITIAL_WORKSPACE_CONTRACTS[0].milestones,
    activityLogs: [],
  };
}

export async function createContractFromProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<WorkspaceContract | null> {
  try {
    // 1. Check if contract row already exists
    const { data: existing } = await supabase
      .from("contracts")
      .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
      .eq("proposal_id", proposalId)
      .maybeSingle();

    if (existing) {
      return mapRowToWorkspaceContract(existing);
    }

    // 2. Fetch proposal data
    const { data: prop, error: propErr } = await supabase
      .from("proposals")
      .select("*, projects(*, clients(*)), freelancers(*), proposal_milestones(*)")
      .eq("id", proposalId)
      .single();

    if (propErr || !prop) {
      console.error("createContractFromProposal proposal lookup failed:", propErr?.message);
      return null;
    }

    const deliveryDays = prop.delivery_days || 14;
    const startDate = new Date();
    const endDate = new Date(Date.now() + deliveryDays * 86400000);

    // 3. Insert into contracts table (safe single select, then fetch joined row)
    const { data: created, error: insertErr } = await supabase
      .from("contracts")
      .insert({
        proposal_id: proposalId,
        total_amount: Number(prop.bid_amount),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      })
      .select()
      .maybeSingle();

    if (!insertErr && created) {
      const { data: fullContract } = await supabase
        .from("contracts")
        .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
        .eq("id", created.id)
        .maybeSingle();
      if (fullContract) {
        return mapRowToWorkspaceContract(fullContract);
      }
      return mapRowToWorkspaceContract({ ...created, proposals: prop });
    }

    if (insertErr) {
      console.warn("createContractFromProposal insert fallback:", insertErr.message);
    }

    return mapProposalToContract(prop);
  } catch (err) {
    console.error("createContractFromProposal failed:", err);
    return null;
  }
}

export async function fetchUserContracts(
  supabase: SupabaseClient,
  opts?: {
    role?: "client" | "freelancer" | "admin";
    userId?: string | null;
    entityId?: string | null;
  }
): Promise<WorkspaceContract[]> {
  try {
    // 1. Fetch contracts table
    const { data: contractRows } = await supabase
      .from("contracts")
      .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
      .order("start_date", { ascending: false });

    const liveContracts = (contractRows || []).map(mapRowToWorkspaceContract);
    const existingProposalIds = new Set(liveContracts.map((c) => c.proposalId).filter(Boolean));

    // 2. Also fetch accepted proposals that may not have contracts yet
    const { data: acceptedProps } = await supabase
      .from("proposals")
      .select("*, projects(*, clients(*)), freelancers(*), proposal_milestones(*)")
      .in("status", ["accepted", "ACCEPTED"])
      .order("created_at", { ascending: false });

    const uncontractedProps = (acceptedProps || [])
      .filter((p: any) => !existingProposalIds.has(p.id))
      .map(mapProposalToContract);

    const allLive = [...liveContracts, ...uncontractedProps];

    // Filter strictly by role & user if provided
    let filtered = allLive;
    if (opts?.userId || opts?.entityId || opts?.role) {
      const matchClient = (c: WorkspaceContract) => {
        const uId = opts.userId;
        const eId = opts.entityId;
        if (!uId && !eId) return false;
        if (uId && (c.client.userId === uId || c.client.id === uId)) return true;
        if (eId && (c.client.id === eId || c.client.userId === eId)) return true;
        return false;
      };

      const matchFreelancer = (c: WorkspaceContract) => {
        const uId = opts.userId;
        const eId = opts.entityId;
        if (!uId && !eId) return false;
        if (uId && (c.freelancer.userId === uId || c.freelancer.id === uId)) return true;
        if (eId && (c.freelancer.id === eId || c.freelancer.userId === eId)) return true;
        return false;
      };

      if (opts.role === "client") {
        filtered = allLive.filter(matchClient);
      } else if (opts.role === "freelancer") {
        filtered = allLive.filter(matchFreelancer);
      } else {
        filtered = allLive.filter((c) => matchClient(c) || matchFreelancer(c));
      }

      // Check if any matching contracts were saved in local session store for this exact user
      const localMatches = getLocalStore().filter((c) => {
        if (opts.role === "client") return matchClient(c);
        if (opts.role === "freelancer") return matchFreelancer(c);
        return matchClient(c) || matchFreelancer(c);
      });

      const seenIds = new Set(filtered.map((c) => c.id));
      for (const lc of localMatches) {
        if (!seenIds.has(lc.id) && (!lc.proposalId || !seenIds.has(`ctr-${lc.proposalId}`))) {
          filtered.push(lc);
          seenIds.add(lc.id);
        }
      }

      // Return only the logged-in user's authentic contracts (empty array if none exist, never leak mock data)
      return filtered;
    }

    // Only unauthenticated / guest demo viewers see local mock store
    return getLocalStore();
  } catch (err) {
    console.warn("fetchUserContracts query fallback:", err);
    return [];
  }
}

export async function fetchContractById(
  supabase: SupabaseClient,
  contractId: string
): Promise<WorkspaceContract | null> {
  const allContracts = await fetchUserContracts(supabase);
  const found = allContracts.find((c) => c.id === contractId);
  if (found) return found;

  const local = getLocalStore();
  return local.find((c) => c.id === contractId) || INITIAL_WORKSPACE_CONTRACTS[0] || null;
}

export async function submitMilestoneDeliverable(
  supabase: SupabaseClient,
  contractId: string,
  milestoneId: string,
  submission: {
    notes: string;
    demoUrl?: string;
    attachments?: string[];
  }
): Promise<WorkspaceContract | null> {
  const store = getLocalStore();
  const index = store.findIndex((c) => c.id === contractId);
  const contract = index !== -1 ? store[index] : INITIAL_WORKSPACE_CONTRACTS[0];
  if (!contract) return null;

  const updatedMilestones = contract.milestones.map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: "SUBMITTED" as const,
        submittedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        deliverableNotes: submission.notes,
        liveUrl: submission.demoUrl,
      };
    }
    return m;
  });

  const newActivity: ContractActivity = {
    id: `act-${Date.now()}`,
    timestamp: "Just now",
    actor: contract.freelancer.name,
    actorRole: "FREELANCER",
    action: "Milestone Deliverable Submitted",
    details: submission.notes || "Freelancer submitted completed work for client review.",
    badgeType: "SUBMISSION",
  };

  const updatedContract: WorkspaceContract = {
    ...contract,
    milestones: updatedMilestones,
    activityLogs: [newActivity, ...contract.activityLogs],
  };

  if (index !== -1) {
    store[index] = updatedContract;
  } else {
    store.push(updatedContract);
  }
  saveLocalStore(store);

  return updatedContract;
}

export async function approveMilestone(
  supabase: SupabaseClient,
  contractId: string,
  milestoneId: string
): Promise<WorkspaceContract | null> {
  const store = getLocalStore();
  const index = store.findIndex((c) => c.id === contractId);
  const contract = index !== -1 ? store[index] : INITIAL_WORKSPACE_CONTRACTS[0];
  if (!contract) return null;

  let approvedAmount = 0;
  const updatedMilestones = contract.milestones.map((m) => {
    if (m.id === milestoneId) {
      approvedAmount = m.amountBdt;
      return {
        ...m,
        status: "APPROVED_RELEASED" as const,
      };
    }
    return m;
  });

  const newReleased = contract.releasedBdt + approvedAmount;
  const newEscrowHeld = Math.max(0, contract.escrowHeldBdt - approvedAmount);
  const newRemaining = Math.max(0, contract.remainingBdt - approvedAmount);
  const allApproved = updatedMilestones.every((m) => m.status === "APPROVED_RELEASED" || m.status === "APPROVED_AND_RELEASED");

  const newActivity: ContractActivity = {
    id: `act-${Date.now()}`,
    timestamp: "Just now",
    actor: contract.client.name,
    actorRole: "CLIENT",
    action: `Milestone Approved · ৳${approvedAmount.toLocaleString()} BDT Released`,
    details: "Funds transferred from escrow custody to freelancer wallet balance.",
    badgeType: "PAYOUT",
    trxId: `TRX-REL${Math.floor(100000 + Math.random() * 900000)}`,
  };

  const updatedContract: WorkspaceContract = {
    ...contract,
    stage: allApproved ? "COMPLETED" : contract.stage,
    escrowHeldBdt: newEscrowHeld,
    releasedBdt: newReleased,
    remainingBdt: newRemaining,
    milestones: updatedMilestones,
    activityLogs: [newActivity, ...contract.activityLogs],
  };

  if (index !== -1) {
    store[index] = updatedContract;
  } else {
    store.push(updatedContract);
  }
  saveLocalStore(store);

  return updatedContract;
}

export async function requestMilestoneRevision(
  supabase: SupabaseClient,
  contractId: string,
  milestoneId: string,
  feedback: string
): Promise<WorkspaceContract | null> {
  const store = getLocalStore();
  const index = store.findIndex((c) => c.id === contractId);
  const contract = index !== -1 ? store[index] : INITIAL_WORKSPACE_CONTRACTS[0];
  if (!contract) return null;

  const updatedMilestones = contract.milestones.map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: "REVISION_REQUESTED" as const,
      };
    }
    return m;
  });

  const newActivity: ContractActivity = {
    id: `act-${Date.now()}`,
    timestamp: "Just now",
    actor: contract.client.name,
    actorRole: "CLIENT",
    action: "Revision Requested on Milestone",
    details: feedback || "Client requested adjustments to the submitted deliverable.",
    badgeType: "REVISION",
  };

  const updatedContract: WorkspaceContract = {
    ...contract,
    milestones: updatedMilestones,
    activityLogs: [newActivity, ...contract.activityLogs],
  };

  if (index !== -1) {
    store[index] = updatedContract;
  } else {
    store.push(updatedContract);
  }
  saveLocalStore(store);

  return updatedContract;
}
