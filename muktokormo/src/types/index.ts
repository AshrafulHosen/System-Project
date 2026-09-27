export type JobCategory = 
  | "Web & App Development"
  | "UI/UX & Graphic Design"
  | "Digital Marketing & SEO"
  | "Video Editing & Animation"
  | "Bangla & English Content"
  | "Virtual Assistance & Data";

export interface Job {
  id: string;
  title: string;
  titleBn?: string;
  clientName: string;
  clientLocation: string;
  clientRating: number;
  clientVerified: boolean;
  category: JobCategory;
  description: string;
  descriptionBn?: string;
  budgetBdt: number;
  jobType: "Fixed Price" | "Milestone Based";
  experienceLevel: "Entry Level" | "Intermediate" | "Expert";
  skills: string[];
  proposalsCount: number;
  postedAt: string;
  deadlineDays: number;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

export interface Freelancer {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  hourlyRateBdt: number;
  earnedBdt: number;
  isNidVerified: boolean;
  skills: string[];
  successRate: number;
  bio: string;
}

export interface ProposalSubmission {
  jobId: string;
  freelancerName: string;
  bidAmountBdt: number;
  platformFeeBdt: number;
  netEarnedBdt: number;
  deliveryDays: number;
  coverLetter: string;
  phone: string;
}
