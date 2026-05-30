import { useState, useCallback } from "react";

const API = "http://localhost:8000";

const SEVERITY_COLOR = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6366f1",
};

const SEVERITY_BG = {
  high: "#fef2f2",
  medium: "#fffbeb",
  low: "#eef2ff",
};

const TYPE_ICON = {
  grammar: "⚡",
  clarity: "🔍",
  tone: "🎯",
  readability: "📖",
  spelling: "✏️",
  style: "🖊",
};

function ScoreRing({ score }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 1 }}>SCORE</span>
      </div>
    </div>
  );
}

function IssueCard({ issue, onHighlight }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => { setOpen(!open); onHighlight(issue.original); }}
      style={{
        background: SEVERITY_BG[issue.severity],
        border: `1.5px solid ${SEVERITY_COLOR[issue.severity]}22`,
        borderLeft: `4px solid ${SEVERITY_COLOR[issue.severity]}`,
        borderRadius: 10, padding: "12px 16px", cursor: "pointer",
        marginBottom: 8, transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{TYPE_ICON[issue.type] || "•"}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", textTransform: "capitalize" }}>{issue.type}</span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px",
          borderRadius: 99, background: SEVERITY_COLOR[issue.severity],
          color: "#fff", textTransform: "uppercase", letterSpacing: 0.5
        }}>{issue.severity}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
        <span style={{ background: "#fecaca", padding: "1px 4px", borderRadius: 4, fontFamily: "monospace" }}>
          "{issue.original}"
        </span>
        <span style={{ margin: "0 6px" }}>→</span>
        <span style={{ background: "#bbf7d0", padding: "1px 4px", borderRadius: 4, fontFamily: "monospace" }}>
          "{issue.suggestion}"
        </span>
      </div>
      {open && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#64748b", lineHeight: 1.6, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
          {issue.explanation}
        </div>
      )}
    </div>
  );
}

function Tab({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
      background: active ? "#1e293b" : "transparent",
      color: active ? "#fff" : "#64748b",
      fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
      transition: "all 0.15s"
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? "#6366f1" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
          borderRadius: 99, padding: "0 7px", fontSize: 11, fontWeight: 800
        }}>{count}</span>
      )}
    </button>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("proofread");
  const [styleGuide, setStyleGuide] = useState("AP");
  const [toneTarget, setToneTarget] = useState("professional");
  const [rewriteGoal, setRewriteGoal] = useState("simplify");
  const [summaryLength, setSummaryLength] = useState("short");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [highlighted, setHighlighted] = useState("");

  const call = useCallback(async (endpoint, body) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Request failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const run = () => {
    if (!text.trim()) { setError("Please enter some text first."); return; }
    if (activeTab === "proofread") call("proofread", { text, style_guide: styleGuide, tone_target: toneTarget, focus: ["grammar", "clarity", "tone", "readability", "spelling", "style"] });
    if (activeTab === "seo") call("seo-keywords", { text, target_audience: "general", num_keywords: 12 });
    if (activeTab === "summarize") call("summarize", { text, length: summaryLength });
    if (activeTab === "rewrite") call("rewrite", { text, goal: rewriteGoal });
  };

  const highlightedText = useCallback(() => {
    if (!highlighted || !text) return text;
    return text.split(highlighted).join(`<mark style="background:#fde68a;border-radius:3px">${highlighted}</mark>`);
  }, [text, highlighted]);

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#1e293b", color: "#fff", padding: "0 32px",
        display: "flex", alignItems: "center", height: 60, gap: 16,
        boxShadow: "0 2px 12px #0002"
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>✦ ProofAI</span>
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: 4 }}>Editorial Intelligence</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["proofread", "seo", "summarize", "rewrite"].map(t => (
            <Tab key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={activeTab === t} onClick={() => { setActiveTab(t); setResult(null); }} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 24, maxWidth: 1400, margin: "0 auto" }}>

        {/* Left: Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>Article Text</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>{text.length} / 10,000</span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your article or text here..."
              style={{
                width: "100%", minHeight: 320, padding: "16px 20px",
                border: "none", outline: "none", resize: "vertical",
                fontSize: 14, lineHeight: 1.8, color: "#334155",
                fontFamily: "inherit", boxSizing: "border-box",
                background: "transparent"
              }}
            />
          </div>

          {/* Options */}
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: "16px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Options</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {activeTab === "proofread" && (
                <>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Style Guide
                    <select value={styleGuide} onChange={e => setStyleGuide(e.target.value)}
                      style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 12 }}>
                      {["AP", "Chicago", "APA", "House"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Target Tone
                    <select value={toneTarget} onChange={e => setToneTarget(e.target.value)}
                      style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 12 }}>
                      {["professional", "casual", "academic", "journalistic", "conversational"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </>
              )}
              {activeTab === "rewrite" && (
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  Goal
                  <select value={rewriteGoal} onChange={e => setRewriteGoal(e.target.value)}
                    style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 12 }}>
                    {["simplify", "formalize", "energize", "concise"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </label>
              )}
              {activeTab === "summarize" && (
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  Length
                  <select value={summaryLength} onChange={e => setSummaryLength(e.target.value)}
                    style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 12 }}>
                    {["short", "medium", "long"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </label>
              )}
            </div>
          </div>

          <button onClick={run} disabled={loading} style={{
            background: loading ? "#94a3b8" : "#1e293b",
            color: "#fff", border: "none", borderRadius: 12, padding: "14px 0",
            fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.3, transition: "background 0.15s",
            boxShadow: loading ? "none" : "0 4px 16px #1e293b33"
          }}>
            {loading ? "⏳ Analyzing..." : `▶ Run ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          </button>

          {error && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!result && !loading && (
            <div style={{
              background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: 400, color: "#94a3b8", gap: 12
            }}>
              <span style={{ fontSize: 48 }}>✦</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Results will appear here</span>
              <span style={{ fontSize: 12 }}>Paste text and run analysis</span>
            </div>
          )}

          {/* PROOFREAD RESULTS */}
          {result && activeTab === "proofread" && (
            <>
              {/* Score + Summary */}
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <ScoreRing score={result.overall_score} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 6 }}>Editorial Assessment</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{result.summary}</div>
                    <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.strengths?.map((s, i) => (
                        <span key={i} style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>✓ {s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Readability + Tone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>READABILITY</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{result.readability?.grade_level}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Avg sentence: {result.readability?.avg_sentence_length} words</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Passive voice: {result.readability?.passive_voice_count}×</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>{result.readability?.assessment}</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>TONE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#6366f1", textTransform: "capitalize" }}>{result.tone_analysis?.detected_tone}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{result.tone_analysis?.alignment}</div>
                  <ul style={{ margin: "8px 0 0", padding: "0 0 0 14px", fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                    {result.tone_analysis?.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>

              {/* Issues */}
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 16 }}>
                  Issues Found <span style={{ color: "#94a3b8", fontWeight: 400 }}>({result.issues?.length || 0})</span>
                </div>
                {result.issues?.length === 0 && (
                  <div style={{ color: "#22c55e", fontWeight: 600, fontSize: 14 }}>✓ No issues found!</div>
                )}
                {result.issues?.map((issue, i) => (
                  <IssueCard key={i} issue={issue} onHighlight={setHighlighted} />
                ))}
              </div>
            </>
          )}

          {/* SEO RESULTS */}
          {result && activeTab === "seo" && (
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 16 }}>SEO Analysis</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>META DESCRIPTION</div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#334155", lineHeight: 1.6, border: "1.5px solid #e2e8f0" }}>
                  {result.meta_description}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>TITLE SUGGESTIONS</div>
                {result.title_suggestions?.map((t, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "#f1f5f9", marginBottom: 6, fontSize: 13, color: "#1e293b", fontWeight: 600 }}>
                    {i + 1}. {t}
                  </div>
                ))}
              </div>
              {[["PRIMARY KEYWORDS", result.primary_keywords, "#dbeafe", "#1d4ed8"],
                ["SECONDARY KEYWORDS", result.secondary_keywords, "#ede9fe", "#6d28d9"],
                ["LONG-TAIL PHRASES", result.long_tail, "#dcfce7", "#166534"]].map(([label, kws, bg, color]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {kws?.map((k, i) => (
                      <span key={i} style={{ background: bg, color, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUMMARY RESULTS */}
          {result && activeTab === "summarize" && (
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 20 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", fontFamily: "monospace" }}>{result.word_count_original}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>ORIGINAL</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", color: "#94a3b8" }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#6366f1", fontFamily: "monospace" }}>{result.word_count_summary}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>SUMMARY</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                  <span style={{ background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
                    {Math.round((1 - result.word_count_summary / result.word_count_original) * 100)}% shorter
                  </span>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>Summary</div>
              <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, marginBottom: 20, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                {result.summary}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>Key Points</div>
              {result.key_points?.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ background: "#6366f1", color: "#fff", borderRadius: 99, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* REWRITE RESULTS */}
          {result && activeTab === "rewrite" && (
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px #0001", padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>Rewritten Text</div>
              <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0", marginBottom: 16, whiteSpace: "pre-wrap" }}>
                {result.rewritten}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>Changes Made</div>
              {result.changes_made?.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#475569" }}>
                  <span style={{ color: "#22c55e", fontWeight: 800 }}>✓</span> {c}
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#eff6ff", borderRadius: 10, fontSize: 13, color: "#1d4ed8", border: "1.5px solid #bfdbfe" }}>
                💡 {result.improvement_notes}
              </div>
              <button onClick={() => { setText(result.rewritten); setResult(null); }} style={{
                marginTop: 14, background: "#1e293b", color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer"
              }}>
                ↑ Use Rewritten Text
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
