import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

// ── Sample Data ──────────────────────────────────────────────
const monthlyConsultData = [
  { month: "1월", 상담수: 42, 동의수: 28, 동의율: 66.7 },
  { month: "2월", 상담수: 38, 동의수: 24, 동의율: 63.2 },
  { month: "3월", 상담수: 51, 동의수: 36, 동의율: 70.6 },
  { month: "4월", 상담수: 47, 동의수: 29, 동의율: 61.7 },
  { month: "5월", 상담수: 55, 동의수: 41, 동의율: 74.5 },
  { month: "6월", 상담수: 49, 동의수: 32, 동의율: 65.3 },
  { month: "7월", 상담수: 58, 동의수: 44, 동의율: 75.9 },
  { month: "8월", 상담수: 53, 동의수: 35, 동의율: 66.0 },
  { month: "9월", 상담수: 60, 동의수: 39, 동의율: 65.0 },
  { month: "10월", 상담수: 44, 동의수: 26, 동의율: 59.1 },
  { month: "11월", 상담수: 62, 동의수: 45, 동의율: 72.6 },
  { month: "12월", 상담수: 57, 동의수: 38, 동의율: 66.7 },
];

const revenueByCategory = [
  { name: "임플란트", value: 38500000, color: "#2563EB" },
  { name: "교정", value: 24200000, color: "#0EA5E9" },
  { name: "보철", value: 15800000, color: "#64748B" },
  { name: "심미", value: 9600000, color: "#94A3B8" },
  { name: "일반진료", value: 7900000, color: "#CBD5E1" },
];

const recentConsults = [
  { date: "04/13", patient: "김*희", item: "임플란트 2개", proposed: 5200000, agreed: 5200000, consultant: "이상담", status: "동의" },
  { date: "04/13", patient: "박*준", item: "전악교정", proposed: 8500000, agreed: 0, consultant: "김상담", status: "미동의", reason: "비용 부담" },
  { date: "04/12", patient: "최*영", item: "라미네이트 4개", proposed: 3200000, agreed: 3200000, consultant: "이상담", status: "동의" },
  { date: "04/12", patient: "정*현", item: "임플란트 1개", proposed: 2800000, agreed: 2400000, consultant: "박상담", status: "일부동의", reason: "단계적 진행" },
  { date: "04/11", patient: "윤*서", item: "교정+미백", proposed: 6100000, agreed: 0, consultant: "김상담", status: "미동의", reason: "타 병원 비교" },
];

const TARGET = 96000000;
const CURRENT = 76500000;
const ACHIEVEMENT = Math.round((CURRENT / TARGET) * 100);

// ── AI Action Plan Generator ──────────────────────────────────
async function generateActionPlan(consultData) {
  const recentRate = consultData.slice(-3).reduce((a, b) => a + b.동의율, 0) / 3;
  const prompt = `당신은 치과 병원 경영 컨설턴트입니다. 아래 데이터를 분석하여 즉시 실행 가능한 마케팅 및 상담 개선 액션 플랜을 제안해주세요.

현황:
- 최근 3개월 평균 상담 동의율: ${recentRate.toFixed(1)}%
- 업계 평균 동의율: 72%
- 주요 미동의 사유: 비용 부담, 타 병원 비교
- 이번 달 매출 목표 달성률: ${ACHIEVEMENT}%

다음 형식으로 답변해주세요:
1. 현황 진단 (2~3문장)
2. 즉시 실행 액션 (3가지, 각 구체적인 실행 방법 포함)
3. 단기 목표 KPI (1개월 내 달성 목표)

간결하고 실용적으로 작성해주세요.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "분석 결과를 가져올 수 없습니다.";
}

// ── Sub Components ────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, color = "#2563EB" }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16,
      padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>{value}</span>
      {sub && (
        <span style={{ fontSize: 13, color: trend === "up" ? "#10B981" : trend === "down" ? "#EF4444" : "#64748B" }}>
          {trend === "up" ? "▲" : trend === "down" ? "▼" : ""} {sub}
        </span>
      )}
      <div style={{ height: 3, background: "#F1F5F9", borderRadius: 99, marginTop: 8 }}>
        <div style={{ height: 3, width: "100%", background: color, borderRadius: 99, opacity: 0.3 }} />
      </div>
    </div>
  );
}

function GoalProgress({ current, target, achievement }) {
  const fmtW = (v) => (v / 10000).toFixed(0) + "만";
  return (
    <div style={{
      background: "#0F172A", borderRadius: 16, padding: "24px 28px", color: "#fff"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>당월 매출 목표 달성률</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {achievement}<span style={{ fontSize: 20, fontWeight: 500, color: "#94A3B8" }}>%</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "#64748B" }}>목표</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#E2E8F0" }}>{fmtW(target)}원</div>
        </div>
      </div>
      <div style={{ background: "#1E293B", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.min(achievement, 100)}%`,
          background: "linear-gradient(90deg, #2563EB, #38BDF8)",
          borderRadius: 99, transition: "width 1.2s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 13, color: "#64748B" }}>현재 {fmtW(current)}원</span>
        <span style={{ fontSize: 13, color: "#38BDF8" }}>잔여 {fmtW(target - current)}원</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0F172A", border: "1px solid #1E293B", borderRadius: 10,
      padding: "10px 16px", fontSize: 13, color: "#E2E8F0"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#fff" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" && p.name === "동의율" ? p.value.toFixed(1) + "%" : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

function StatusBadge({ status }) {
  const styles = {
    "동의": { bg: "#ECFDF5", color: "#059669", label: "동의" },
    "미동의": { bg: "#FEF2F2", color: "#DC2626", label: "미동의" },
    "일부동의": { bg: "#FFF7ED", color: "#D97706", label: "일부" },
  };
  const s = styles[status] || styles["미동의"];
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 99,
      fontSize: 11, fontWeight: 700, padding: "3px 10px", letterSpacing: "0.04em"
    }}>{s.label}</span>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function BizDocDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiPlan, setAiPlan] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [chartView, setChartView] = useState("rate");

  const currentMonth = monthlyConsultData[monthlyConsultData.length - 1];
  const prevMonth = monthlyConsultData[monthlyConsultData.length - 2];
  const rateDelta = (currentMonth.동의율 - prevMonth.동의율).toFixed(1);
  const totalRevenue = revenueByCategory.reduce((a, b) => a + b.value, 0);

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setAiPlan("");
    setActiveTab("ai");
    try {
      const result = await generateActionPlan(monthlyConsultData);
      setAiPlan(result);
    } catch (e) {
      setAiError("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "개요" },
    { id: "consult", label: "상담 분석" },
    { id: "revenue", label: "매출 현황" },
    { id: "ai", label: "AI 전략" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      padding: "0 0 40px"
    }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E2E8F0",
        padding: "0 24px", position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#0F172A",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "#38BDF8", fontWeight: 800, fontSize: 14 }}>B</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#0F172A", letterSpacing: "-0.02em" }}>BizDoc</span>
            <span style={{ fontSize: 12, color: "#94A3B8", borderLeft: "1px solid #E2E8F0", paddingLeft: 10, marginLeft: 2 }}>치과 경영 대시보드</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>2025년 4월</span>
            <button onClick={handleAiAnalysis} style={{
              background: "#0F172A", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}>
              <span style={{ fontSize: 14 }}>✦</span> AI 전략 분석
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 0" }}>
        {/* Tab Nav */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#F1F5F9", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              background: activeTab === t.id ? "#fff" : "transparent",
              color: activeTab === t.id ? "#0F172A" : "#94A3B8",
              boxShadow: activeTab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
            }}>{t.label}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            {/* KPI Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
              <KpiCard label="당월 상담수" value={`${currentMonth.상담수}건`} sub="전월 대비 +8건" trend="up" color="#2563EB" />
              <KpiCard label="상담 동의율" value={`${currentMonth.동의율.toFixed(1)}%`}
                sub={`${rateDelta > 0 ? "+" : ""}${rateDelta}% vs 전월`}
                trend={rateDelta >= 0 ? "up" : "down"} color="#0EA5E9" />
              <KpiCard label="이번달 매출" value={`${(CURRENT / 10000).toFixed(0)}만`} sub="목표 대비 79.7%" trend="up" color="#64748B" />
              <KpiCard label="미수금" value="4,200만" sub="전월 대비 -12%" trend="up" color="#EF4444" />
            </div>

            {/* Progress + Chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 20 }}>
              <GoalProgress current={CURRENT} target={TARGET} achievement={ACHIEVEMENT} />
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 20px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>월별 상담 동의율 추이</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["rate", "count"].map(v => (
                      <button key={v} onClick={() => setChartView(v)} style={{
                        padding: "4px 12px", borderRadius: 6, border: "1px solid #E2E8F0",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        background: chartView === v ? "#0F172A" : "#fff",
                        color: chartView === v ? "#fff" : "#64748B"
                      }}>{v === "rate" ? "동의율" : "상담수"}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  {chartView === "rate" ? (
                    <LineChart data={monthlyConsultData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <YAxis domain={[50, 85]} tick={{ fontSize: 11, fill: "#94A3B8" }} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="동의율" stroke="#2563EB" strokeWidth={2.5}
                        dot={{ r: 3, fill: "#2563EB" }} activeDot={{ r: 5 }} name="동의율" />
                    </LineChart>
                  ) : (
                    <BarChart data={monthlyConsultData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="상담수" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="상담수" />
                      <Bar dataKey="동의수" fill="#2563EB" radius={[4, 4, 0, 0]} name="동의수" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Consults */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>최근 상담 현황</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {["날짜", "환자", "항목", "제안금액", "동의금액", "상담자", "상태"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94A3B8", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentConsults.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F8FAFC" }}>
                        <td style={{ padding: "10px 12px", color: "#64748B", whiteSpace: "nowrap" }}>{r.date}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>{r.patient}</td>
                        <td style={{ padding: "10px 12px", color: "#475569" }}>{r.item}</td>
                        <td style={{ padding: "10px 12px", color: "#475569", whiteSpace: "nowrap" }}>{r.proposed.toLocaleString()}원</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: r.agreed > 0 ? "#059669" : "#94A3B8", whiteSpace: "nowrap" }}>
                          {r.agreed > 0 ? r.agreed.toLocaleString() + "원" : "—"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#64748B" }}>{r.consultant}</td>
                        <td style={{ padding: "10px 12px" }}><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONSULT TAB */}
        {activeTab === "consult" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 20px 8px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>월별 동의율 상세</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>업계 평균 72% 기준선</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyConsultData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis domain={[50, 85]} tick={{ fontSize: 11, fill: "#94A3B8" }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="동의율" stroke="#2563EB" strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return <circle key={cx} cx={cx} cy={cy} r={4}
                        fill={payload.동의율 >= 72 ? "#10B981" : "#EF4444"} stroke="#fff" strokeWidth={2} />;
                    }} name="동의율" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Monthly breakdown */}
              {[
                { label: "평균 동의율 (연간)", value: (monthlyConsultData.reduce((a, b) => a + b.동의율, 0) / 12).toFixed(1) + "%", color: "#2563EB" },
                { label: "최고 동의율", value: Math.max(...monthlyConsultData.map(d => d.동의율)).toFixed(1) + "%", color: "#10B981" },
                { label: "최저 동의율", value: Math.min(...monthlyConsultData.map(d => d.동의율)).toFixed(1) + "%", color: "#EF4444" },
                { label: "총 상담 건수", value: monthlyConsultData.reduce((a, b) => a + b.상담수, 0) + "건", color: "#64748B" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
                  padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontSize: 13, color: "#64748B" }}>{s.label}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</span>
                </div>
              ))}
            </div>
            {/* Non-consent reasons */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>미동의 사유 분석</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {[
                  { reason: "비용 부담", count: 18, pct: 42 },
                  { reason: "타 병원 비교", count: 12, pct: 28 },
                  { reason: "가족 상의 필요", count: 8, pct: 19 },
                  { reason: "시간 부족", count: 5, pct: 11 },
                ].map((r, i) => (
                  <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>{r.reason}</div>
                    <div style={{ background: "#E2E8F0", borderRadius: 99, height: 6, marginBottom: 6 }}>
                      <div style={{ height: 6, width: `${r.pct}%`, background: "#2563EB", borderRadius: 99 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B" }}>
                      <span>{r.count}건</span><span style={{ fontWeight: 700, color: "#2563EB" }}>{r.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === "revenue" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 20px 8px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>진료 항목별 매출 비중</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={revenueByCategory} cx="50%" cy="50%" outerRadius={90}
                    dataKey="value" nameKey="name" paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (v / 10000).toFixed(0) + "만원"} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#0F172A", borderRadius: 16, padding: "20px 24px", color: "#fff", marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>총 매출 (이번달)</div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {(totalRevenue / 10000).toFixed(0)}<span style={{ fontSize: 16, color: "#94A3B8" }}>만원</span>
                </div>
              </div>
              {revenueByCategory.map((r, i) => (
                <div key={i} style={{
                  background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 12
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#475569", flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{(r.value / 10000).toFixed(0)}만</span>
                  <span style={{ fontSize: 12, color: "#94A3B8", minWidth: 36, textAlign: "right" }}>
                    {((r.value / totalRevenue) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            {/* Monthly revenue bar */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 20px 8px", gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>월별 매출 / 미수금 추이</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { month: "9월", 수납액: 8200, 미수금: 1200 },
                  { month: "10월", 수납액: 7600, 미수금: 1800 },
                  { month: "11월", 수납액: 9100, 미수금: 900 },
                  { month: "12월", 수납액: 8800, 미수금: 1400 },
                  { month: "1월", 수납액: 7200, 미수금: 2100 },
                  { month: "2월", 수납액: 8400, 미수금: 1600 },
                  { month: "3월", 수납액: 9600, 미수금: 1100 },
                  { month: "4월(현재)", 수납액: 7650, 미수금: 4200 },
                ]} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} unit="만" />
                  <Tooltip formatter={(v) => v + "만원"} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="수납액" fill="#2563EB" radius={[4, 4, 0, 0]} name="수납액" stackId="a" />
                  <Bar dataKey="미수금" fill="#FCA5A5" radius={[4, 4, 0, 0]} name="미수금" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI TAB */}
        {activeTab === "ai" && (
          <div style={{ maxWidth: 720 }}>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, background: "#0F172A", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                }}>✦</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>AI 경영 전략 분석</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>현황 데이터 기반 맞춤 액션 플랜 생성</div>
                </div>
              </div>

              {/* Context summary */}
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", margin: "20px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "최근 3개월 평균 동의율", value: (monthlyConsultData.slice(-3).reduce((a, b) => a + b.동의율, 0) / 3).toFixed(1) + "%" },
                  { label: "당월 목표 달성률", value: ACHIEVEMENT + "%" },
                  { label: "주요 미동의 사유", value: "비용 부담 42%" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {!aiPlan && !aiLoading && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>
                    현재 상담 동의율 데이터를 바탕으로 AI가 맞춤형 마케팅 전략을 분석합니다.
                  </div>
                  <button onClick={handleAiAnalysis} style={{
                    background: "#0F172A", color: "#fff", border: "none", borderRadius: 10,
                    padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer"
                  }}>✦ 지금 AI 분석 시작</button>
                </div>
              )}

              {aiLoading && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%", background: "#2563EB",
                        animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>AI가 경영 데이터를 분석하고 있습니다...</div>
                  <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }`}</style>
                </div>
              )}

              {aiError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "14px 16px", color: "#DC2626", fontSize: 13 }}>
                  {aiError}
                </div>
              )}

              {aiPlan && (
                <div>
                  <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0369A1", marginBottom: 12, letterSpacing: "0.06em" }}>AI ANALYSIS RESULT</div>
                    <div style={{
                      fontSize: 14, color: "#0F172A", lineHeight: 1.8, whiteSpace: "pre-wrap"
                    }}>{aiPlan}</div>
                  </div>
                  <button onClick={handleAiAnalysis} style={{
                    marginTop: 16, background: "transparent", color: "#64748B",
                    border: "1px solid #E2E8F0", borderRadius: 8,
                    padding: "8px 18px", fontSize: 12, cursor: "pointer"
                  }}>↺ 다시 분석하기</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

