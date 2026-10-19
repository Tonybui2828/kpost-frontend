"use client";
import React from "react";
import { PrivacyTab } from "../settings/page";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <PrivacyTab />
      </div>
    </div>
  );
}