"use client";
import React from "react";
import { GuideTab } from "../settings/page";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-100">
        <GuideTab />
      </div>
    </div>
  );
}