const fs = require('fs');
const path = 'src/app/settings/page.tsx';

if (!fs.existsSync(path)) {
  console.error('❌ Không tìm thấy ' + path + '! Hãy mở terminal ở thư mục gốc kpost-frontend.');
  process.exit(1);
}

let code = fs.readFileSync(path, 'utf8');

// 1. Khôi phục nếu file từng bị lỗi HTML
if (code.includes('<!doctype') || code.includes('<title>Cookie check</title>')) {
  try {
    require('child_process').execSync('git checkout da9727f -- ' + path);
    code = fs.readFileSync(path, 'utf8');
  } catch (e) {}
}

// 2. Chèn hàm tính toán 07 ngày PRO TRIAL
const subFn = `  // 🌟 TÍNH NĂNG TỰ ĐỘNG CỘNG 07 NGÀY PRO TRIAL CHO KHÁCH MỚI
  const resolveUserSubscription = (userData: any) => {
    if (!userData) return null;
    const email = (userData.email || "").toLowerCase().trim();
    const rawPlan = (userData.plan || "").toUpperCase().trim();
    const rawExpiry = userData.planExpiry || userData.planExpire || userData.expireDate || null;
    const createdAt = userData.createdAt || userData.created_at || userData.createdDate || null;

    if (rawExpiry && new Date(rawExpiry).getTime() > Date.now()) {
      const remaining = Math.max(1, Math.ceil((new Date(rawExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const isExplicitTrial = userData.isTrial === true || rawPlan === "PRO TRIAL" || rawPlan === "TRIAL";
      return {
        ...userData,
        plan: isExplicitTrial ? "PRO" : (rawPlan.replace(" MEMBER", "") || "PRO"),
        displayPlan: isExplicitTrial ? "PRO TRIAL" : (rawPlan || "PRO"),
        planExpiry: new Date(rawExpiry).toISOString(),
        isTrial: isExplicitTrial,
        remainingDays: remaining,
      };
    }

    let trialStartTime: number;
    if (createdAt && !isNaN(new Date(createdAt).getTime())) {
      trialStartTime = new Date(createdAt).getTime();
    } else {
      const cachedStart = typeof window !== "undefined" ? localStorage.getItem("kpost_trial_start_" + email) : null;
      if (cachedStart && !isNaN(new Date(cachedStart).getTime())) {
        trialStartTime = new Date(cachedStart).getTime();
      } else {
        trialStartTime = Date.now();
      }
    }

    try {
      if (email && typeof window !== "undefined") {
        const existing = localStorage.getItem("kpost_trial_start_" + email);
        if (!existing) {
          localStorage.setItem("kpost_trial_start_" + email, new Date(trialStartTime).toISOString());
        }
      }
    } catch (e) {}

    const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
    const trialEndTime = trialStartTime + trialDurationMs;
    const diffMs = trialEndTime - Date.now();

    if (diffMs > 0) {
      const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return {
        ...userData,
        plan: "PRO",
        displayPlan: "PRO TRIAL",
        planExpiry: new Date(trialEndTime).toISOString(),
        isTrial: true,
        trialDays: 7,
        remainingDays: daysLeft,
      };
    } else {
      return {
        ...userData,
        plan: "FREE",
        displayPlan: "FREE MEMBER",
        planExpiry: null,
        isTrial: false,
        remainingDays: 0,
        trialExpired: true,
      };
    }
  };

  const fetchProfile = async () => {`;

if (!code.includes('resolveUserSubscription')) {
  code = code.replace('const fetchProfile = async () => {', subFn);
}

// 3. Sử dụng resolveUserSubscription khi fetchProfile nhận data
code = code.replace('setUser(res.data);', 'const processed = resolveUserSubscription(res.data); setUser(processed);');

// 4. Sửa điều kiện isPlanFree để không báo hết hạn khi đang dùng thử
code = code.replace(
  'const isPlanFree = user && user.plan && user.plan.toUpperCase() === "FREE";',
  'const isPlanFree = user && user.plan && user.plan.toUpperCase() === "FREE" && !user.isTrial;'
);

// 5. Thêm banner chào mừng PRO TRIAL và giữ banner hết hạn
const oldBanner = '{isPlanFree && (';
const newBanner = `{user?.isTrial && remainingDays !== null && remainingDays > 3 && (
        <div className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white shadow-lg z-50 flex items-center justify-between px-4 md:px-8 py-2.5 border-b border-orange-400/40">
          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-3">
            <span className="bg-white/20 backdrop-blur-sm text-yellow-200 text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-yellow-300/40 flex items-center gap-1">
              <Sparkles size={12} /> ĐẶC QUYỀN KHÁCH MỚI
            </span>
            <div className="truncate text-xs md:text-sm font-bold tracking-wide">
              🎉 Bạn đang được kích hoạt <strong className="text-yellow-200 uppercase font-black">07 ngày dùng thử PRO Miễn Phí</strong>! Còn <span className="text-yellow-200 font-black underline underline-offset-2">{remainingDays} ngày trải nghiệm</span> toàn bộ tính năng cao cấp.
            </div>
          </div>
          <button onClick={() => setActiveTab("billing")} className="bg-white hover:bg-yellow-50 text-orange-600 font-black text-xs md:text-sm px-3.5 py-1.5 rounded-xl shadow-md uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0">
            <Crown size={15} className="text-amber-500 fill-amber-500" /> Nâng cấp VIP
          </button>
        </div>
      )}

      {isPlanFree && !user?.isTrial && (`;

if (!code.includes('ĐẶC QUYỀN KHÁCH MỚI')) {
  code = code.replace(oldBanner, newBanner);
}

// 6. Hiển thị PRO TRIAL bên sidebar Settings
code = code.replace(
  '{user.name} - <span className="text-[#f9570c] font-black">{user.plan || "PRO"}</span>',
  '{user.name} - <span className="text-[#f9570c] font-black">{user.isTrial ? `PRO TRIAL (${remainingDays || 7} NGÀY)` : (user.displayPlan || user.plan || "PRO")}</span>'
);

// 7. Hiển thị PRO TRIAL tại ô Gói hiện tại
const oldPlan = '<p className="text-xl font-black text-[#f9570c] italic uppercase">{user.plan || "PRO"} MEMBER</p>';
const newPlan = `<p className="text-xl font-black text-[#f9570c] italic uppercase">{user.isTrial ? "PRO TRIAL" : (user.displayPlan || \`\${user.plan || "PRO"} MEMBER\`)}</p>
                            {user.isTrial && remainingDays !== null && remainingDays > 0 && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-[#f9570c] to-amber-500 text-white shadow-sm">
                                    <Crown size={12} className="fill-white" /> Dùng thử 07 ngày (Còn {remainingDays} ngày)
                                </span>
                            )}`;

if (!code.includes('Dùng thử 07 ngày (Còn')) {
  code = code.replace(oldPlan, newPlan);
}

fs.writeFileSync(path, code, 'utf8');
console.log('✅ ĐÃ CẬP NHẬT XONG FILE src/app/settings/page.tsx THÀNH CÔNG 100%!');