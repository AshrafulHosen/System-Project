"use client";

import React from "react";
import { TOP_FREELANCERS } from "@/data/mockData";
import { Star, ShieldCheck, CheckCircle2, ArrowRight, UserCheck } from "lucide-react";

interface FreelancerDirectoryProps {
  lang: "en" | "bn";
  onHireDirect: (freelancerName: string) => void;
}

export default function FreelancerDirectory({
  lang,
  onHireDirect,
}: FreelancerDirectoryProps) {
  return (
    <section id="freelancers-section" className="py-16 bg-slate-50/70 border-t border-slate-100 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-5 h-5 text-sky-500" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {lang === "en" ? "Top Verified Bangladeshi Talent" : "শীর্ষ ভেরিফাইড ফ্রিল্যান্সারগণ"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "Every profile is NID Smart Card verified with authentic client reviews."
                : "জাতীয় পরিচয়পত্র যাচাইকৃত নির্ভরযোগ্য দেশীয় এক্সপার্টদের সাথে সরাসরি কাজ করুন।"}
            </p>
          </div>

          <div className="mt-3 sm:mt-0">
            <span className="text-xs font-semibold text-sky-700 flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              {lang === "en" ? "Porichoy NID Verified" : "এনআইডি দ্বারা সত্যায়িত"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOP_FREELANCERS.map((freelancer) => (
            <div
              key={freelancer.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-6 transition-all duration-150 shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Avatar & Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative">
                    <img
                      src={freelancer.avatar}
                      alt={freelancer.name}
                      className="w-13 h-13 rounded-2xl object-cover border border-slate-200"
                    />
                    {freelancer.isNidVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5" title="NID Verified">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {freelancer.name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{freelancer.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-sky-600 truncate mt-0.5">
                      {freelancer.title}
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      {freelancer.location}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="mt-3.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {freelancer.bio}
                </p>

                {/* Skills */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {freelancer.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rate & Hire CTA */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    {lang === "en" ? "Hourly Rate" : "প্রতি ঘণ্টা"}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    ৳{freelancer.hourlyRateBdt.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400">/hr</span>
                  </span>
                </div>

                <button
                  onClick={() => onHireDirect(freelancer.name)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <span>{lang === "en" ? "Invite" : "আমন্ত্রণ"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
