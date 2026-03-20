/**
 * HistoryPage — Web version of HistoryScreen
 * Dark theme, matching HomeHeader/HomeFooter aesthetic
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  Timer,
  TrendingUp,
  Wifi,
} from "lucide-react";
import apiClient, { api, getAuthUser, getErrorMessage } from "../services/api";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";

const PAGE_SIZE = 20;

// Status config
const STATUS_CONFIG = {
  scored: {
    label: "Đã chấm",
    color: "#58cc02",
    bg: "rgba(88,204,2,0.12)",
    icon: CheckCircle2,
  },
  graded: {
    label: "Đã chấm",
    color: "#58cc02",
    bg: "rgba(88,204,2,0.12)",
    icon: CheckCircle2,
  },
  grading: {
    label: "Đang chấm",
    color: "#f5a623",
    bg: "rgba(245,166,35,0.12)",
    icon: Timer,
  },
  pending: {
    label: "Chờ xử lý",
    color: "#8e8e93",
    bg: "rgba(142,142,147,0.1)",
    icon: Timer,
  },
  error: {
    label: "Thử lại",
    color: "#ff6b6b",
    bg: "rgba(255,107,107,0.1)",
    icon: AlertCircle,
  },
};

function getBandColor(score) {
  if (score == null || Number.isNaN(score)) return "#8e8e93";
  if (score < 4) return "#ff6b6b";
  if (score < 7) return "#3b82f6";
  return "#58cc02";
}

function getBandLabel(score) {
  if (score >= 7) return "Tốt";
  if (score >= 4) return "Khá";
  return "Cần cải thiện";
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Không rõ";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


function EssayCard({ item, index, onClick }) {
  const normStatus = item.status === "grading" ? "grading" : item.status;
  const cfg = STATUS_CONFIG[normStatus] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const displayScore = item.score ?? item.overallScore ?? item.overallBand;
  const bandColor = displayScore != null ? getBandColor(displayScore) : "#8e8e93";

  const preview =
    item.textPreview ??
    item.text?.slice(0, 140) ??
    item.originalText?.slice(0, 140) ??
    (typeof item.assignmentId === "object" ? item.assignmentId?.title : null) ??
    "IELTS Writing Essay";

  return (
    <div
      className="ea-card"
      style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="ea-card-accent" style={{ background: bandColor }} />

      <div className="ea-card-inner">
        <div className="ea-card-top">
          <div className="ea-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
            <StatusIcon size={12} strokeWidth={2.5} />
            <span>{cfg.label}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {displayScore != null ? (
              <div className="ea-score" style={{ borderColor: bandColor + "50", color: bandColor }}>
                <span className="ea-score-num">{displayScore.toFixed(1)}</span>
                <span className="ea-score-label" style={{ color: bandColor + "aa" }}>
                  {getBandLabel(displayScore)}
                </span>
              </div>
            ) : (
              <div className="ea-tag">
                <BookOpen size={11} strokeWidth={2} />
                Essay
              </div>
            )}
            <ChevronRight size={16} color="#9ca3af" />
          </div>
        </div>

        <p className="ea-preview">{preview}</p>

        <div className="ea-meta">
          <span className="ea-meta-item">
            <Clock size={11} strokeWidth={2} />
            {formatDate(item.createdAt)}
          </span>
          <span className="ea-meta-item">
            <FileText size={11} strokeWidth={2} />
            {item.wordCount ?? "—"} từ
          </span>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ essays }) {
  const graded = essays.filter((e) => ["scored", "graded"].includes(e.status));
  const avgScore =
    graded.length > 0
      ? (
          graded.reduce(
            (acc, e) => acc + (e.score ?? e.overallScore ?? e.overallBand ?? 0),
            0,
          ) / graded.length
        ).toFixed(1)
      : null;
  const best =
    graded.length > 0
      ? Math.max(
          ...graded.map((e) => e.score ?? e.overallScore ?? e.overallBand ?? 0),
        ).toFixed(1)
      : null;

  const stats = [
    { label: "Tổng bài viết", value: essays.length, icon: FileText, color: "#58cc02" },
    { label: "Đã chấm điểm", value: graded.length, icon: CheckCircle2, color: "#58cc02" },
    {
      label: "Band trung bình",
      value: avgScore ?? "—",
      icon: TrendingUp,
      color: avgScore ? getBandColor(parseFloat(avgScore)) : "#8e8e93",
    },
    {
      label: "Band cao nhất",
      value: best ?? "—",
      icon: TrendingUp,
      color: best ? getBandColor(parseFloat(best)) : "#8e8e93",
    },
  ];

  return (
    <div className="ea-stats">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="ea-stat-card">
            <div className="ea-stat-icon" style={{ background: s.color + "15", color: s.color }}>
              <Icon size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="ea-stat-value" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="ea-stat-label">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "graded", label: "Đã chấm" },
  { key: "grading", label: "Đang chấm" },
  { key: "pending", label: "Chờ xử lý" },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const endpoint = user?.role === "teacher" ? api.teacher.essays : api.essays.list;

  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(null);
  const [filter, setFilter] = useState("all");
  const loaderRef = useRef(null);

  const load = useCallback(
    async (opts = {}) => {
      const { refresh = false, nextPage = 1 } = opts;
      if (refresh) setRefreshing(true);
      else if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await apiClient.get(endpoint, {
          params: { page: nextPage, limit: PAGE_SIZE },
        });
        const payload = res.data?.data;
        const list = payload?.essays ?? payload ?? [];
        const pagination = payload?.pagination ?? null;

        setEssays((prev) => (nextPage === 1 ? list : [...prev, ...list]));
        setPage(pagination?.page ?? nextPage);
        setHasMore((pagination?.page ?? nextPage) < (pagination?.pages ?? 1));
        setTotal(pagination?.total ?? null);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [endpoint],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          load({ nextPage: page + 1 });
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, page, load]);

  const filtered = essays.filter((e) => {
    if (filter === "all") return true;
    if (filter === "graded") return ["scored", "graded"].includes(e.status);
    if (filter === "grading") return e.status === "grading";
    if (filter === "pending") return e.status === "pending";
    return true;
  });

  return (
    <>
      <HomeHeader />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .ea-page {
          min-height: 100vh;
          background: #f7f7f7;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
          color: #1d1d1f;
          padding: 40px 32px 80px;
        }

        .ea-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .ea-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ea-page-title {
          font-size: 28px;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -0.5px;
          margin: 0;
          line-height: 1.1;
        }
        .ea-page-subtitle {
          font-size: 14px;
          color: #6e6e73;
          margin: 4px 0 0;
        }
        .ea-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ea-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #58cc02;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
          text-decoration: none;
        }
        .ea-btn-primary:hover {
          background: #4db802;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(88,204,2,0.35);
        }
        .ea-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #fff;
          color: #1d1d1f;
          border: 1px solid #e5e5ea;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .ea-btn-ghost:hover {
          background: #f0f0f0;
          color: #1d1d1f;
        }
        .ea-btn-ghost:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ea-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .ea-stat-card {
          background: #fff;
          border: 1px solid #e5e5ea;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 12px 30px rgba(15,23,42,0.08);
        }
        .ea-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ea-stat-value {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0;
          line-height: 1;
        }
        .ea-stat-label {
          font-size: 11px;
          color: #6e6e73;
          margin: 3px 0 0;
          font-weight: 500;
        }

        .ea-filters {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .ea-filter-tab {
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #e5e5ea;
          background: #fff;
          color: #6e6e73;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .ea-filter-tab:hover {
          background: #f0f0f0;
          color: #1d1d1f;
        }
        .ea-filter-tab.active {
          background: #e9f9d6;
          border-color: #58cc02;
          color: #2f7d1a;
        }

        .ea-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ea-card {
          display: flex;
          background: #fff;
          border: 1px solid #e5e5ea;
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeSlideUp 0.35s ease both;
          outline: none;
        }
        .ea-card:hover {
          background: #f7f7f7;
          border-color: rgba(88,204,2,0.35);
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(15,23,42,0.12);
        }
        .ea-card:focus-visible {
          border-color: rgba(88,204,2,0.5);
          box-shadow: 0 0 0 3px rgba(88,204,2,0.15);
        }
        .ea-card-accent {
          width: 4px;
          flex-shrink: 0;
          border-radius: 0;
        }
        .ea-card-inner {
          flex: 1;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ea-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ea-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .ea-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1.5px solid;
          border-radius: 10px;
          padding: 5px 12px;
          min-width: 54px;
        }
        .ea-score-num {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .ea-score-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .ea-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f5f5f7;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #6e6e73;
        }
        .ea-preview {
          font-size: 14px;
          color: #6e6e73;
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ea-meta {
          display: flex;
          gap: 20px;
        }
        .ea-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #8a8a8f;
          font-weight: 500;
        }

        .ea-center {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .ea-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e5e5ea;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .ea-empty-title {
          font-size: 22px;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -0.3px;
          margin: 0;
        }
        .ea-muted {
          font-size: 14px;
          color: #6e6e73;
          margin: 0;
        }

        .ea-loader-row {
          display: flex;
          justify-content: center;
          padding: 24px 0;
        }
        .ea-count-row {
          text-align: center;
          font-size: 12px;
          color: #8a8a8f;
          padding: 16px 0;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ea-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .ea-page { padding: 24px 16px 60px; }
          .ea-stats { grid-template-columns: repeat(2, 1fr); }
          .ea-page-title { font-size: 22px; }
        }
        @media (max-width: 480px) {
          .ea-stats { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ea-page">
        <div className="ea-inner">
          {loading && (
            <div className="ea-center">
              <Loader2 size={32} color="#58cc02" className="ea-spin" />
              <p className="ea-muted">Đang tải bài viết...</p>
            </div>
          )}

          {!loading && error && (
            <div className="ea-center">
              <div className="ea-icon-circle">
                <Wifi size={28} color="#8e8e93" strokeWidth={1.5} />
              </div>
              <h2 className="ea-empty-title">Không thể kết nối</h2>
              <p
                className="ea-muted"
                style={{ maxWidth: 300, textAlign: "center" }}
              >
                {error}
              </p>
              <button className="ea-btn-primary" onClick={() => load()}>
                <RefreshCw size={14} strokeWidth={2} /> Thử lại
              </button>
            </div>
          )}

          {!loading && !error && essays.length === 0 && (
            <div className="ea-center">
              <div
                className="ea-icon-circle"
                style={{
                  background: "rgba(88,204,2,0.12)",
                  border: "1px solid rgba(88,204,2,0.2)",
                }}
              >
                <PenLine size={28} color="#58cc02" strokeWidth={1.5} />
              </div>
              <h2 className="ea-empty-title">Chưa có bài viết nào!</h2>
              <p
                className="ea-muted"
                style={{ maxWidth: 280, textAlign: "center" }}
              >
                Viết bài luận đầu tiên và xem kết quả AI chấm điểm ngay tại đây.
              </p>
              <Link
                to="/essay/input"
                className="ea-btn-primary"
                style={{ textDecoration: "none" }}
              >
                <PenLine size={14} strokeWidth={2} /> Viết bài ngay
              </Link>
            </div>
          )}

          {!loading && !error && essays.length > 0 && (
          <>
          <div className="ea-page-header">
            <div>
              <h1 className="ea-page-title">Lịch sử bài viết</h1>
              <p className="ea-page-subtitle">
                {total ?? essays.length} bài viết · theo dõi hành trình luyện tập của bạn
              </p>
            </div>
            <div className="ea-header-actions">
              <button
                className="ea-btn-ghost"
                onClick={() => load({ refresh: true })}
                disabled={refreshing}
              >
                <RefreshCw size={13} strokeWidth={2} className={refreshing ? "ea-spin" : ""} />
                {refreshing ? "Đang tải..." : "Làm mới"}
              </button>
              <Link to="/essay/input" className="ea-btn-primary" style={{ textDecoration: "none" }}>
                <PenLine size={13} strokeWidth={2.5} />
                Viết bài mới
              </Link>
            </div>
          </div>

          <StatsBar essays={essays} />

          <div className="ea-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`ea-filter-tab${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== "all" && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>
                    ({essays.filter((e) => {
                      if (f.key === "graded") return ["scored", "graded"].includes(e.status);
                      return e.status === f.key;
                    }).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="ea-center" style={{ minHeight: "30vh" }}>
              <p className="ea-muted">Không có bài viết nào trong mục này.</p>
            </div>
          ) : (
            <div className="ea-list">
              {filtered.map((item, index) => {
                const id = (() => {
                  const _id = item._id;
                  if (typeof _id === "string") return _id;
                  if (_id && typeof _id === "object") return _id.$oid ?? null;
                  return null;
                })();
                return (
                  <EssayCard
                    key={id ?? index}
                    item={item}
                    index={index}
                    onClick={() => {
                      if (!id) return;
                      navigate(`/essay/result?essayId=${id}`);
                    }}
                  />
                );
              })}
            </div>
          )}

          <div ref={loaderRef} />

          {loadingMore && (
            <div className="ea-loader-row">
              <Loader2 size={20} color="#58cc02" className="ea-spin" />
            </div>
          )}

          {!hasMore && essays.length > 0 && (
            <p className="ea-count-row">
              Đã hiển thị tất cả {total ?? essays.length} bài viết
            </p>
          )}
          </>
          )}
        </div>
      </div>
      <HomeFooter />
    </>
  );
}
