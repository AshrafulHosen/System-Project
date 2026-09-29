"use client";

import React from "react";
import JobPostWizard from "@/components/jobpost/JobPostWizard";

export default function PostJobPage() {
  return <JobPostWizard onExit={() => window.history.back()} />;
}
