/**
 * Curated, factual description of Muktokormo used to ground the site assistant.
 *
 * Keep this in sync with the product. Every statement here must be true of the
 * current code — the assistant is instructed to answer ONLY from this text.
 */
import { DEFAULT_PLATFORM_FEE_PCT } from "@/lib/payments/constants";

const FEE = DEFAULT_PLATFORM_FEE_PCT;
const NET = 100 - FEE;

export const SITE_KNOWLEDGE = `
# About Muktokormo
Muktokormo (মুক্তকর্ম) is a freelance marketplace for Bangladesh. Clients hire freelancers for projects, and all money is in Bangladeshi Taka (BDT, ৳). There are three account types: client, freelancer and administrator. Sign up at /signup and log in at /login.

# Fees
- The platform fee is ${FEE}% of the amount released to the freelancer. The freelancer receives ${NET}%. Example: on ৳10,000 the fee is ৳${(10000 * FEE / 100).toLocaleString("en-US")} and the freelancer receives ৳${(10000 * NET / 100).toLocaleString("en-US")}.
- The fee is deducted when a payment is released, not when the client pays into escrow.
- Contracts created before the fee changed keep the rate they were created with.

# For clients
- Post a job at /post-job: title, skills, scope, budget and description. A "Create project brief with AI" option turns a short idea into a structured, editable brief. Nothing is published until the client clicks Publish.
- Freelancers send proposals (bids) with an amount, delivery time and cover letter. Clients review proposals from their dashboard and can shortlist or accept one.
- Accepting a proposal creates a contract. Contracts are listed at /contracts and in the Workspace tab of the dashboard.
- The client pays into escrow through SSLCOMMERZ (bKash, Nagad, Rocket or bank card) before work starts.

# For freelancers
- Browse open jobs on the home page (Find work) and open a job to see its details.
- Place a bid with an amount, delivery days, payout method (bKash, Nagad, Rocket or bank) and cover letter. The "Generate proposal with AI" helper drafts a cover letter from the freelancer's own profile; the freelancer edits it and submits it themselves.
- Work starts only after the client has funded the contract or milestone.
- Released earnings appear in the freelancer dashboard under Wallet & Payouts. Payouts are currently recorded in the platform's internal escrow ledger; the withdrawal form shows a preview only and does not transfer money to bKash or a bank.

# Escrow and payments
- Escrow means the client's money is held while work happens and is released to the freelancer only after the client approves the delivery.
- A payment is marked as funded only after it has been verified by the server with SSLCOMMERZ.
- Each payment is recorded in an escrow ledger (fund, release, refund) that both parties can see on the contract page.
- The escrow explanation page is /escrow.

# Single-payment contracts
- The whole contract amount is funded at once.
- The freelancer starts work, then submits the work (a description plus optional demo or repository link).
- The client either approves and releases the payment, or requests a revision with feedback.
- A client can request a refund on a funded contract; an administrator reviews the request against the escrow ledger.

# Milestone contracts
- A contract can be split into milestones, each with its own title, description, deliverables, amount, optional start date and deadline. The client can switch a contract to milestones only before any payment has been made.
- The client proposes the milestone plan; the freelancer accepts it or requests changes. Once accepted, the plan is locked.
- Later changes need agreement: the client can propose an additional milestone, which the freelancer accepts or declines. An unfunded milestone can be cancelled only if both sides agree (one requests, the other confirms).
- Each milestone is funded separately. Milestone statuses: Pending (awaiting funding), Funded, In progress, Submitted, Revision requested, Approved, Released (paid), Cancelled, Disputed.
- Flow: client funds → freelancer starts and submits → client approves or requests a revision → after approval the client releases the payment. A milestone cannot be approved before it is funded and submitted, and cannot be released before it is approved.
- The full submission and revision history is kept for every milestone.
- Disputes: either party can open a dispute on a funded milestone with a reason. The money stays in escrow while an administrator reviews the submissions and decides to release it to the freelancer, refund the client, or let work resume. Every decision is recorded.
- When all remaining milestones are released, the contract is completed.

# Reviews and ratings
- After a contract is completed (every payment released), the client can review the freelancer and the freelancer can review the client — one review each per contract.
- Freelancer reviews rate: work quality, communication, technical skills, professionalism, deadline management. Client reviews rate: communication, requirement clarity, professionalism, payment reliability, cooperation. Each is 1–5 stars; the overall rating is calculated automatically from these.
- Written feedback is required; highlights, strengths and areas for improvement are optional. Reviews cannot be edited after submission.
- Anyone can report a review. Administrators can hide, remove or restore reviews, and ratings are recalculated automatically. Profile ratings come only from reviews and cannot be edited by users.
- Reviews are in the dashboard Reviews tab, on the contract page and on freelancer profiles.

# Communication
- Each contract has a workspace with real-time messaging. All conversations are at /messages.
- Notifications (bell icon in the dashboard) cover payments, submissions, approvals, releases, disputes and reviews.

# Where to find things
- Home and job search: /
- How it works (steps, escrow, statuses, FAQ): /how-it-works
- Post a job: /post-job
- Dashboard: /dashboard
- Contracts: /contracts
- Workspaces: /workspaces
- Messages: /messages
- Escrow explained: /escrow
- Sign up: /signup · Log in: /login

# Things the assistant does not know
- It cannot see anyone's account, contracts, payments or messages.
- It has no information about identity-verification procedures, company contact details, legal terms or refund timelines beyond what is written above.
`.trim();

/** Internal pages the assistant may link to. Anything else is dropped server-side. */
export const ASSISTANT_LINKS: Record<string, string> = {
  "/": "Home",
  "/how-it-works": "How it works",
  "/post-job": "Post a job",
  "/dashboard": "Dashboard",
  "/contracts": "Contracts",
  "/workspaces": "Workspaces",
  "/messages": "Messages",
  "/escrow": "Escrow explained",
  "/signup": "Sign up",
  "/login": "Log in",
};
