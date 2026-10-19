"use client";
import React, { useEffect, useState } from "react";
import { AffiliateTab } from "../settings/page";

export default function AffiliatePage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kpost_user") || localStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-100">
        <AffiliateTab user={user} />
      </div>
    </div>
  );
}