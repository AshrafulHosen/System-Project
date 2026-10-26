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

export async function fetchUserContracts(
  supabase: SupabaseClient,
  opts?: { role?: "client" | "freelancer" | "admin"; entityId?: string | null }
): Promise<WorkspaceContract[]> {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
      .order("start_date", { ascending: false });

    if (!error && data && data.length > 0) {
      const mappedContracts: WorkspaceContract[] = data.map((row: any) => {
        const proposal = row.proposals;
        const project = proposal?.projects;
        const client = project?.clients;
        const freelancer = proposal?.freelancers;
        const milestonesRaw = proposal?.proposal_milestones ?? [];

        const milestones: WorkspaceMilestone[] = milestonesRaw.map((m: any, idx: number) => ({
          id: m.id || `ms-${idx + 1}`,
          order: m.sort_order || idx + 1,
          title: m.title || `Milestone ${idx + 1}`,
          description: m.description || `Deliverable phase for milestone ${idx + 1}`,
          amountBdt: m.amount_bdt || Math.round(row.total_amount / (milestonesRaw.length || 1)),
          dueDate: m.delivery_days ? `${m.delivery_days} days` : row.end_date || "2026-11-01",
          status: idx === 0 ? "IN_PROGRESS" : "LOCKED_IN_ESCROW",
        }));

        const totalBdt = row.total_amount || 40000;
        const platformFeePct = 7;
        const netEarningsBdt = Math.round(totalBdt * 0.93);

        return {
          id: row.id,
          contractCode: `MK-CTR-${row.id.slice(0, 6).toUpperCase()}`,
          jobId: project?.id || "job-1",
          title: project?.title || "Contract Engagement",
          titleBn: project?.title_bn || project?.title || "চুক্তি",
          category: (project?.category || "Web & App Development") as any,
          client: {
            name: client?.display_name || client?.company_name || "Verified Client",
            company: client?.company_name || "SME Enterprise BD",
            location: client?.location || "Dhaka, Bangladesh",
            avatar: client?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
            rating: client?.rating || 4.9,
            isVerified: client?.is_verified ?? true,
          },
          freelancer: {
            name: freelancer?.display_name || "Tanvir Rahman",
            title: freelancer?.title || "Senior Software Engineer",
            avatar: freelancer?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            rating: freelancer?.rating || 4.95,
            isNidVerified: freelancer?.is_nid_verified ?? true,
            phone: "+8801712-345678",
            payoutMethod: "BKASH",
            payoutAccount: "+8801712-345678",
          },
          totalBdt,
          platformFeePct,
          netEarningsBdt,
          escrowHeldBdt: Math.round(totalBdt * 0.5),
          releasedBdt: 0,
          remainingBdt: totalBdt,
          startedAt: row.start_date || "Oct 2, 2026",
          deadlineDate: row.end_date || "Nov 2, 2026",
          stage: (row.status?.toUpperCase() || "ACTIVE") as any,
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
      });

      return mappedContracts;
    }
  } catch (err) {
    console.warn("fetchUserContracts database query fallback:", err);
  }

  return getLocalStore();
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
