import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Microscope,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  Lock,
  Unlock,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import ReviewerTeams from "../components/scientific/ReviewerTeams";
import { apiUrl } from "../../config/api";

function Scientific({ api, user, onNavigate, initialTab = "overview" }) {
  // ----------------------------------------------------
  // Role Detection & Hierarchical Workflow
  // ----------------------------------------------------
  const userRole = (user?.role || "").toUpperCase();
  const userPermissions = user?.permissions || [];

  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const isChairpersonRole =
    isSuperAdmin ||
    userRole === "SCIENTIFIC_CHAIRPERSON" ||
    userRole === "RESEARCH" ||
    userPermissions.includes("manage_abstracts") ||
    userPermissions.includes("assign_reviewers");

  const isStrictReviewer =
    !isChairpersonRole &&
    (userRole === "SCIENTIFIC_REVIEWER" ||
      userRole === "REVIEWER" ||
      userPermissions.includes("review_abstracts"));

  const [workflowRole, setWorkflowRole] = useState({
    isChairperson: isChairpersonRole,
    isTeamLead: false,
    isReviewer: isStrictReviewer,
    reviewerId: null,
    leadTeams: [],
    memberTeams: [],
    allTeams: [],
  });

  const [viewMode, setViewMode] = useState(isStrictReviewer ? "reviewer" : "chairperson");

  useEffect(() => {
    api
      .get("/api/research/workflow-role")
      .then((res) => {
        const data = res.data || {};
        setWorkflowRole(data);
        if (data.isChairperson) {
          // Keep chairperson view by default
        } else if (data.isReviewer || isStrictReviewer) {
          setViewMode("reviewer");
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch workflow role", err);
      });
  }, [api, isStrictReviewer]);

  // ----------------------------------------------------
  // Chairperson State
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState(initialTab || "overview"); // "overview" | "abstracts" | "abstract-report" | "team" | "reports" | "settings"

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [statsData, setStatsData] = useState({ stats: {}, recentActivity: [] });
  const [abstracts, setAbstracts] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [reportsData, setReportsData] = useState({});
  const [abstractFilter, setAbstractFilter] = useState("all");
  const [abstractSearch, setAbstractSearch] = useState("");
  const [rankingsData, setRankingsData] = useState({ rankings: [], summary: {}, pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } });
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingFilters, setRankingFilters] = useState({
    search: "",
    category: "all",
    ugPg: "all",
    institution: "",
    reviewStatus: "fully_reviewed",
    status: "all",
    scoreMin: "",
    scoreMax: "",
    sort: "position",
    direction: "asc",
    page: 1,
  });
  
  // Abstract Report (Reviews Sent) State
  const [abstractReviews, setAbstractReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewSearch, setReviewSearch] = useState("");
  const [selectedReviewDetail, setSelectedReviewDetail] = useState(null);

  // Revision Request Modal State (Chairperson -> Author Email)
  const [revisionModalTarget, setRevisionModalTarget] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionSending, setRevisionSending] = useState(false);
  const [revisionFeedbackAlert, setRevisionFeedbackAlert] = useState("");

  const [settings, setSettings] = useState({
    reviewMode: "double_blind",
    maxAuthors: 6,
    maxFileSize: 10,
    allowedFileTypes: "pdf",
    guidelines: "",
    templateUrl: "",
    submissionStartDate: "",
    submissionEndDate: "",
  });
  const [settingsStatus, setSettingsStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Assignment Modal State (Chairperson -> Reviewer Team Allocation)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAbstracts, setSelectedAbstracts] = useState([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignFilter, setAssignFilter] = useState("unassigned"); // "unassigned" | "all"
  const [teams, setTeams] = useState([]);
  const [assigningTeamId, setAssigningTeamId] = useState(null);

  // Abstract Detail / Decision Modal State
  const [viewAbstract, setViewAbstract] = useState(null);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Helper to open assign modal with a single pre-selected abstract or from bulk
  const openAssignModalForAbstract = (abstractItem = null) => {
    if (abstractItem?.id) {
      setSelectedAbstracts([abstractItem.id]);
    } else {
      const unassigned = abstracts.filter((a) => !a.teamId).map((a) => a.id);
      if (selectedAbstracts.length === 0 && unassigned.length > 0) {
        setSelectedAbstracts(unassigned);
      }
    }
    setAssignModalOpen(true);
    api
      .get("/api/research/teams")
      .then((res) => {
        if (res.data?.teams) setTeams(res.data.teams);
      })
      .catch(() => {});
  };

  const handleAssignToTeam = async (team) => {
    if (selectedAbstracts.length === 0) {
      alert("Please select at least one abstract to assign.");
      return;
    }
    setAssigningTeamId(team.id);
    try {
      for (const abstractId of selectedAbstracts) {
        await api.patch(`/api/research/${abstractId}/assign-team`, {
          teamId: team.id,
        });
      }
      const count = selectedAbstracts.length;
      setSelectedAbstracts([]);
      setAssignModalOpen(false);
      await loadChairpersonData();
      alert(
        `✓ Successfully assigned ${count} abstract(s) to ${team.name}! They now appear in the ${team.name} Leader's dashboard.`
      );
    } catch (err) {
      console.error("Failed to assign abstract to team:", err);
      alert(err.response?.data?.message || "Failed to assign to team.");
    } finally {
      setAssigningTeamId(null);
    }
  };

  // ----------------------------------------------------
  // Reviewer State
  // ----------------------------------------------------
  const [myAssignments, setMyAssignments] = useState([]);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [activeReviewModal, setActiveReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    scientificMerit: 8,
    originality: 8,
    methodology: 8,
    presentationQuality: 8,
    relevance: 8,
    comments: "",
    recommendation: "accept",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Reviewer Suspension & Reinstatement State
  const [reviewerProfile, setReviewerProfile] = useState(null);
  const [reviewerSuspended, setReviewerSuspended] = useState(false);
  const [reinstatementModalOpen, setReinstatementModalOpen] = useState(false);
  const [reinstatementReason, setReinstatementReason] = useState("");
  const [reinstatementSubmitted, setReinstatementSubmitted] = useState(false);
  const [reinstatementSubmitting, setReinstatementSubmitting] = useState(false);

  // ----------------------------------------------------
  // Data Fetching: Chairperson
  // ----------------------------------------------------
  const loadChairpersonData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, abstractsRes, reviewersRes, settingsRes, teamsRes] = await Promise.all([
        api.get("/api/research/stats").catch(() => ({ data: { stats: {}, recentActivity: [] } })),
        api.get("/api/research?admin=1&compact=1&limit=75").catch(() => ({ data: { submissions: [] } })),
        api.get("/api/research/reviewers").catch(() => ({ data: { reviewers: [] } })),
        api.get("/api/research/settings").catch(() => ({ data: { settings: {} } })),
        api.get("/api/research/teams").catch(() => ({ data: { teams: [] } })),
      ]);

      setStatsData(statsRes.data || { stats: {}, recentActivity: [] });
      setAbstracts(abstractsRes.data.submissions || []);
      setReviewers(reviewersRes.data.reviewers || []);
      setTeams(teamsRes.data?.teams || []);
      if (settingsRes.data.settings) {
        setSettings((prev) => ({ ...prev, ...settingsRes.data.settings }));
      }
    } catch (err) {
      console.error("Failed to load chairperson data", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadAbstractReviews = useCallback(async () => {
    try {
      const res = await api.get("/api/research/reviews");
      setAbstractReviews(res.data?.reviews || []);
    } catch (err) {
      console.error("Failed to load abstract review report", err);
      setAbstractReviews([]);
    }
  }, [api]);

  const loadReports = useCallback(async () => {
    try {
      const res = await api.get("/api/research/reports");
      setReportsData(res.data.charts || {});
    } catch {
      setReportsData({});
    }
  }, [api]);

  const loadRankings = useCallback(async () => {
    setRankingLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(rankingFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") params.set(key, value);
      });
      params.set("limit", "25");
      const res = await api.get(`/api/research/rankings?${params.toString()}`);
      setRankingsData(res.data || { rankings: [], summary: {}, pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } });
    } catch (err) {
      console.error("Failed to load abstract rankings", err);
      setRankingsData({ rankings: [], summary: {}, pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } });
    } finally {
      setRankingLoading(false);
    }
  }, [api, rankingFilters]);

  // ----------------------------------------------------
  // Data Fetching: Reviewer
  // ----------------------------------------------------
  const loadReviewerData = useCallback(async () => {
    setReviewerLoading(true);
    try {
      const res = await api.get("/api/research/reviews/assigned");
      if (res.data.suspended) {
        setReviewerSuspended(true);
        setReviewerProfile(res.data.reviewer || null);
        setMyAssignments([]);
      } else {
        setReviewerSuspended(false);
        setReviewerProfile(res.data.reviewer || null);
        setMyAssignments(res.data.assignments || []);
      }
    } catch (err) {
      console.error("Failed to load reviewer assignments", err);
      setMyAssignments([]);
    } finally {
      setReviewerLoading(false);
    }
  }, [api]);

  const handleApplyReinstatement = async (e) => {
    e.preventDefault();
    setReinstatementSubmitting(true);
    try {
      await api.post("/api/research/reviewers/reinstatement-request", {
        reason: reinstatementReason,
      });
      setReinstatementSubmitted(true);
      setReinstatementModalOpen(false);
      await loadReviewerData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit reinstatement application.");
    } finally {
      setReinstatementSubmitting(false);
    }
  };

  useEffect(() => {
    if (viewMode === "chairperson") {
      loadChairpersonData();
    } else {
      loadReviewerData();
    }
  }, [viewMode, loadChairpersonData, loadReviewerData]);

  useEffect(() => {
    if (viewMode === "chairperson" && activeTab === "reports") {
      loadReports();
    }
  }, [viewMode, activeTab, loadReports]);

  useEffect(() => {
    if (viewMode === "chairperson" && activeTab === "abstract-report") {
      loadAbstractReviews();
    }
  }, [viewMode, activeTab, loadAbstractReviews]);

  useEffect(() => {
    if (viewMode === "chairperson" && activeTab === "rankings") {
      loadRankings();
    }
  }, [viewMode, activeTab, loadRankings]);

  // ----------------------------------------------------
  // Chairperson Actions: Settings
  // ----------------------------------------------------
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsStatus("saving");
    try {
      await api.put("/api/research/settings", settings);
      setSettingsStatus("saved");
      setTimeout(() => setSettingsStatus(""), 3000);
    } catch {
      setSettingsStatus("error");
    }
  };


  // ----------------------------------------------------
  // Chairperson Actions: Decisions
  // ----------------------------------------------------
  const handleUpdateStatus = async (abstractId, status) => {
    setDecisionSubmitting(true);
    try {
      await api.patch(`/api/research/${abstractId}/status`, { status });
      setViewAbstract(null);
      await loadChairpersonData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update decision.");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleRequestRevision = async (abstractId) => {
    setDecisionSubmitting(true);
    try {
      await api.post(`/api/research/${abstractId}/request-revision`, {});
      alert("Revision request sent to corresponding author.");
      setViewAbstract(null);
      await loadChairpersonData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to request revision.");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Reviewer Actions: Submit Review
  // ----------------------------------------------------
  const openReviewModal = (assignment) => {
    setActiveReviewModal(assignment);
    setReviewForm({
      scientificMerit: 8,
      originality: 8,
      methodology: 8,
      presentationQuality: 8,
      relevance: 8,
      comments: "",
      recommendation: "accept",
    });
    setReviewSuccessMsg("");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeReviewModal) return;
    setSubmittingReview(true);
    try {
      await api.post(`/api/research/${activeReviewModal.abstract_id}/reviews`, reviewForm);
      setReviewSuccessMsg("Evaluation submitted successfully!");
      setTimeout(() => {
        setActiveReviewModal(null);
        setReviewSuccessMsg("");
        loadReviewerData();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculated Review Score Sum
  const totalCalculatedScore = useMemo(() => {
    return (
      Number(reviewForm.scientificMerit || 0) +
      Number(reviewForm.originality || 0) +
      Number(reviewForm.methodology || 0) +
      Number(reviewForm.presentationQuality || 0) +
      Number(reviewForm.relevance || 0)
    );
  }, [reviewForm]);

  // Personalized Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name ? user.name.split(" ")[0] : "Doctor";

  // ----------------------------------------------------
  // Statistics Computations
  // ----------------------------------------------------
  const rawStats = statsData.stats || {};
  const totalAbstracts = Number(rawStats.total || abstracts.length || 0);
  const newSubmissions = Number(rawStats.newSubmissions || abstracts.filter((a) => a.status === "submitted" || a.status === "draft").length || 0);
  const underReview = Number(rawStats.underReview || abstracts.filter((a) => a.status === "under_review").length || 0);
  const acceptedCount = Number(rawStats.accepted || abstracts.filter((a) => a.status === "accepted").length || 0);
  const rejectedCount = Number(rawStats.rejected || abstracts.filter((a) => a.status === "rejected").length || 0);
  const revisionCount = Number(rawStats.revisionRequested || abstracts.filter((a) => a.status === "revision_requested").length || 0);
  const reviewsPending = Number(rawStats.reviewsPending || 0);
  const reviewCompletionRate = Number(rawStats.reviewCompletion || 0);
  const unassignedCount = Number(rawStats.unassignedCount || abstracts.filter((a) => a.status === "submitted").length || 0);

  const unassignedTeamCount = useMemo(() => {
    return abstracts.filter((a) => !a.teamId && a.status !== "accepted" && a.status !== "rejected").length;
  }, [abstracts]);

  const leadApprovedCount = useMemo(() => {
    return abstracts.filter((a) => a.workflowStage === "lead_approved").length;
  }, [abstracts]);

  // Filtered Abstracts for Chairperson Directory
  const filteredAbstracts = useMemo(() => {
    return abstracts.filter((sub) => {
      const q = abstractSearch.toLowerCase().trim();
      const matchesSearch = !q || [sub.title, sub.authors, sub.presentingAuthor, sub.institution, sub.track, sub.category, sub.keywords, sub.abstractId, sub.teamName, sub.assignedReviewerName].join(" ").toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (abstractFilter === "all") return true;
      if (abstractFilter === "unassigned_team") return !sub.teamId && sub.status !== "accepted" && sub.status !== "rejected";
      if (abstractFilter === "lead_approved") return sub.workflowStage === "lead_approved";
      if (abstractFilter === "submitted") return sub.status === "submitted" || sub.status === "draft";
      if (abstractFilter === "under_review") return sub.status === "under_review";
      if (abstractFilter === "revision_requested") return sub.status === "revision_requested";
      if (abstractFilter === "accepted") return sub.status === "accepted";
      if (abstractFilter === "rejected") return sub.status === "rejected";
      return true;
    });
  }, [abstracts, abstractFilter, abstractSearch]);

  // Filtered Reviews for Chairperson Abstract Report
  const filteredAbstractReviews = useMemo(() => {
    return abstractReviews.filter((r) => {
      const q = reviewSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        [r.title, r.abstractCode, r.reviewer_name, r.reviewer_email, r.specialization, r.comments, r.category, r.track]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      if (!matchesSearch) return false;

      if (reviewFilter === "all") return true;
      if (reviewFilter === "accept") return r.recommendation?.toLowerCase() === "accept";
      if (reviewFilter === "revise") return r.recommendation?.toLowerCase() === "revise";
      if (reviewFilter === "reject") return r.recommendation?.toLowerCase() === "reject";
      return true;
    });
  }, [abstractReviews, reviewFilter, reviewSearch]);

  const totalReviewsCount = abstractReviews.length;
  const acceptCount = abstractReviews.filter((r) => r.recommendation?.toLowerCase() === "accept").length;
  const reviseCount = abstractReviews.filter((r) => r.recommendation?.toLowerCase() === "revise").length;
  const rejectCount = abstractReviews.filter((r) => r.recommendation?.toLowerCase() === "reject").length;
  const avgReviewScore = totalReviewsCount > 0
    ? (abstractReviews.reduce((sum, r) => sum + Number(r.total_score || 0), 0) / totalReviewsCount).toFixed(1)
    : "0.0";

  const formatScore = useCallback((val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = Number(val);
    if (isNaN(num)) return "-";
    return num % 1 === 0 ? String(num) : num.toFixed(1);
  }, []);

  const openAbstractDetail = useCallback(async (fallback) => {
    if (!fallback) return;
    setViewAbstract(fallback);
    const id = fallback.id || fallback.abstract_id || fallback.abstractId;
    if (!id) return;
    try {
      const res = await api.get(`/api/research/${id}`);
      setViewAbstract(res.data?.submission || res.data || fallback);
    } catch (err) {
      console.warn("Failed to load full abstract detail", err);
    }
  }, [api]);

  const handleOpenAbstractFromReview = useCallback((rev) => {
    if (!rev) return;
    const matching = abstracts.find((a) => a.id === rev.abstract_id);
    const sub = matching || {
      id: rev.abstract_id,
      abstractId: rev.abstractCode || `GHC-ABS-${String(rev.abstract_id).padStart(5, "0")}`,
      title: rev.title,
      category: rev.category,
      track: rev.track,
      status: rev.abstract_status || "under_review",
      pdfUrl: rev.pdf_url || rev.file_url,
      fileUrl: rev.file_url || rev.pdf_url,
      pdf_url: rev.pdf_url,
      abstract_text: rev.abstract_text,
      abstractText: rev.abstract_text,
    };
    openAbstractDetail(sub);
  }, [abstracts, openAbstractDetail]);

  const handleOpenRevisionModal = useCallback((item) => {
    if (!item) return;
    const abstractId = item.abstract_id || item.id;
    const matchingAbstract = abstracts.find((a) => a.id === abstractId);
    const authorEmail = item.author_email || matchingAbstract?.email || item.email || "";
    const authorName = item.presenting_author || matchingAbstract?.presentingAuthor || item.authors || "Author";
    const title = item.title || matchingAbstract?.title || "";
    const code = item.abstractCode || matchingAbstract?.abstractId || `GHC-ABS-${String(abstractId).padStart(5, "0")}`;
    const defaultNotes = item.comments || item.review_notes || "";

    setRevisionModalTarget({
      abstractId,
      title,
      code,
      email: authorEmail,
      authorName,
    });
    setRevisionNotes(defaultNotes);
    setRevisionFeedbackAlert("");
  }, [abstracts]);

  const handleSendRevisionEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!revisionModalTarget) return;
    setRevisionSending(true);
    setRevisionFeedbackAlert("");
    try {
      const res = await api.post(`/api/research/${revisionModalTarget.abstractId}/request-revision`, {
        notes: revisionNotes,
        revisionNotes: revisionNotes,
      });
      const recipient = res.data?.recipient || revisionModalTarget.email;
      setRevisionFeedbackAlert(
        res.data?.emailSent
          ? `Revision request & notification email sent successfully to ${recipient}!`
          : `Revision status recorded. Note: Email notification dispatch could not be confirmed.`
      );
      setTimeout(async () => {
        setRevisionModalTarget(null);
        setRevisionFeedbackAlert("");
        await loadChairpersonData();
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send revision request email.");
    } finally {
      setRevisionSending(false);
    }
  };

  const handleExportReviewsCsv = useCallback(() => {
    if (!abstractReviews || abstractReviews.length === 0) return;
    const headers = [
      "Review ID",
      "Abstract ID",
      "Title",
      "Category",
      "Track",
      "Reviewer Name",
      "Reviewer Email",
      "Specialization",
      "Recommendation",
      "Total Score (/50)",
      "Scientific Merit (/10)",
      "Originality (/10)",
      "Methodology (/10)",
      "Presentation (/10)",
      "Relevance (/10)",
      "Comments",
      "Reviewed Date",
    ];
    const escapeCsv = (val) => `"${String(val ?? "").replaceAll('"', '""')}"`;
    const rows = abstractReviews.map((r) => [
      r.id,
      r.abstractCode || `GHC-ABS-${String(r.abstract_id).padStart(5, "0")}`,
      escapeCsv(r.title),
      escapeCsv(r.category),
      escapeCsv(r.track),
      escapeCsv(r.reviewer_name),
      escapeCsv(r.reviewer_email),
      escapeCsv(r.specialization),
      r.recommendation,
      r.total_score,
      r.scientific_merit,
      r.originality,
      r.methodology,
      r.presentation_quality,
      r.relevance,
      escapeCsv(r.comments),
      r.reviewed_at ? new Date(r.reviewed_at).toISOString() : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ghc_abstract_reviews_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [abstractReviews]);

  const updateRankingFilter = useCallback((key, value) => {
    setRankingFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }, []);

  const handleExportRankings = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(rankingFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    });
    window.open(`${api.defaults.baseURL || ""}/api/research/rankings/export?${params.toString()}`, "_blank", "noopener,noreferrer");
  }, [api, rankingFilters]);

  const handleOpenRankingAbstract = useCallback((row) => {
    const matching = abstracts.find((a) => a.id === row.id);
    openAbstractDetail(matching || {
      id: row.id,
      abstractId: row.abstractId,
      title: row.title,
      presentingAuthor: row.applicantName,
      institution: row.institution,
      category: row.category,
      yearOfStudy: row.yearOfStudy,
      status: row.abstractStatus,
      finalScore: row.finalScore,
    });
  }, [abstracts, openAbstractDetail]);

  // Reviewer personal metrics
  const reviewerAssignedCount = myAssignments.length;
  const reviewerCompletedCount = myAssignments.filter((a) => a.review_state === "completed").length;
  const reviewerPendingCount = reviewerAssignedCount - reviewerCompletedCount;

  // ====================================================
  // ====================================================
  // RENDER: REVIEWER VIEW
  // ====================================================
  if (viewMode === "reviewer") {
    if (reviewerSuspended) {
      const hasPendingApp = reviewerProfile?.reinstatement_status === "pending" || reinstatementSubmitted;
      return (
        <div className="admin-speakers-page" style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
          {(isChairpersonRole || workflowRole?.isChairperson) && (
            <div style={{ marginBottom: "1rem", textAlign: "right" }}>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setViewMode("chairperson")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Sliders size={15} /> Exit Reviewer View
              </button>
            </div>
          )}

          <div
            className="admin-panel"
            style={{
              textAlign: "center",
              padding: "3.5rem 2rem",
              borderRadius: "1.5rem",
              borderTop: "6px solid #dc2626",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <ShieldAlert size={36} />
            </div>

            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#dc2626",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: "#fef2f2",
                padding: "0.3rem 0.85rem",
                borderRadius: "999px",
              }}
            >
              Account Suspended
            </span>

            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "1rem 0 0.5rem 0", color: "#111827" }}>
              Reviewer Dashboard Locked
            </h1>

            <p style={{ color: "#4b5563", fontSize: "1rem", maxWidth: "520px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
              Your scientific reviewer access has been temporarily suspended by the Scientific Committee Chairperson or Super Admin. All review duties are locked.
            </p>

            {reviewerProfile?.suspension_reason && (
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: "0.75rem",
                  padding: "1rem 1.5rem",
                  maxWidth: "480px",
                  margin: "0 auto 1.5rem",
                  border: "1px solid #e5e7eb",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Reason for Suspension:</span>
                <p style={{ margin: "0.25rem 0 0 0", color: "#1f2937", fontSize: "0.9rem", fontStyle: "italic" }}>
                  "{reviewerProfile.suspension_reason}"
                </p>
              </div>
            )}

            {hasPendingApp ? (
              <div
                style={{
                  background: "#ecfdf5",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  maxWidth: "480px",
                  margin: "0 auto",
                  border: "1px solid #a7f3d0",
                }}
              >
                <CheckCircle2 size={28} style={{ color: "#059669", margin: "0 auto 0.5rem" }} />
                <h3 style={{ margin: "0 0 0.25rem 0", color: "#065f46", fontWeight: 700 }}>
                  Application for Reinstatement Submitted
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857" }}>
                  Your application is pending review by the Scientific Committee Chairperson. You will regain access once approved.
                </p>
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="admin-primary-button"
                  style={{
                    padding: "0.85rem 2rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onClick={() => setReinstatementModalOpen(true)}
                >
                  <RotateCcw size={18} /> Apply for reinstatement
                </button>
              </div>
            )}
          </div>

          {/* Reinstatement Modal */}
          {reinstatementModalOpen && (
            <div
              className="admin-modal-overlay"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem",
              }}
              onClick={() => setReinstatementModalOpen(false)}
            >
              <div
                className="admin-panel"
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  margin: 0,
                  padding: "2rem",
                  borderRadius: "1.25rem",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>
                  Apply for Reinstatement
                </h2>
                <p className="admin-muted" style={{ margin: "0 0 1.25rem 0", fontSize: "0.875rem" }}>
                  Submit an explanation or request note to the Scientific Committee Chairperson to reinstate your reviewer privileges.
                </p>

                <form onSubmit={handleApplyReinstatement}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                    Reason / Request Note *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide any context, confirmation of availability, or details for reinstatement..."
                    value={reinstatementReason}
                    onChange={(e) => setReinstatementReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                      marginBottom: "1.5rem",
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => setReinstatementModalOpen(false)}
                      disabled={reinstatementSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={reinstatementSubmitting}
                    >
                      {reinstatementSubmitting ? "Submitting..." : "Submit Reinstatement Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="admin-speakers-page" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
        {/* Top bar with View Switcher if Chairperson */}
        <section className="admin-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "rgba(108, 74, 182, 0.08)", color: "#6C4AB6", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              <Microscope size={14} /> Scientific Reviewer Workspace
            </div>
            <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.75rem", fontWeight: 800 }}>My Scientific Reviews</h1>
            <p className="admin-muted" style={{ margin: 0 }}>Review the abstracts assigned to you and submit evaluations.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="admin-icon-button"
              title="Refresh assignments"
              onClick={loadReviewerData}
            >
              <RefreshCw size={16} className={reviewerLoading ? "spin" : ""} />
            </button>
          </div>
        </section>

        {/* Reviewer Profile Badge & Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", margin: "1.25rem 0" }}>
          <div className="admin-panel" style={{ padding: "1.25rem", margin: 0, borderLeft: "4px solid #6C4AB6" }}>
            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Assigned Abstracts</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111827", marginTop: "0.25rem" }}>{reviewerAssignedCount}</div>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Total allocated to you</span>
          </div>

          <div className="admin-panel" style={{ padding: "1.25rem", margin: 0, borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Pending Evaluation</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>{reviewerPendingCount}</div>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Awaiting your scoring</span>
          </div>

          <div className="admin-panel" style={{ padding: "1.25rem", margin: 0, borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Completed Reviews</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>{reviewerCompletedCount}</div>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Evaluations submitted</span>
          </div>

          <div className="admin-panel" style={{ padding: "1.25rem", margin: 0, borderLeft: "4px solid #8b5cf6" }}>
            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Completion Progress</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#7c3aed", marginTop: "0.25rem" }}>
              {reviewerAssignedCount > 0 ? Math.round((reviewerCompletedCount / reviewerAssignedCount) * 100) : 100}%
            </div>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Personal velocity</span>
          </div>
        </div>

        {/* Assignments Table */}
        <section className="admin-panel" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Assigned Abstracts</h2>
              <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.875rem" }}>Select an abstract to inspect full details and submit your scores.</p>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, padding: "0.3rem 0.75rem", borderRadius: "999px", background: "#f3f4f6", color: "#4b5563" }}>
              {myAssignments.length} Assigned
            </span>
          </div>

          {reviewerLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading your assignments...</div>
          ) : myAssignments.length === 0 ? (
            <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", background: "#f9fafb", borderRadius: "1rem", border: "1px dashed #e5e7eb" }}>
              <ClipboardCheck size={40} style={{ color: "#9ca3af", margin: "0 auto 1rem" }} />
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 600 }}>No abstracts assigned yet</h3>
              <p className="admin-muted" style={{ margin: 0, maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
                The Scientific Committee Chairperson will assign abstracts to your profile for evaluation. When assigned, they will appear here.
              </p>
            </div>
          ) : (
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead>
                  <tr>
                    <th>Abstract Code</th>
                    <th>Title & Category</th>
                    <th>Authors & Track</th>
                    <th>Assigned Date</th>
                    <th>Review Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myAssignments.map((item) => {
                    const isCompleted = item.review_state === "completed";
                    return (
                      <tr key={item.id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.06)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                            {item.abstractCode || `GHC-ABS-${String(item.abstract_id).padStart(5, "0")}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#111827", maxWidth: "340px", lineHeight: 1.3 }}>{item.title}</div>
                          <span style={{ fontSize: "0.75rem", textTransform: "capitalize", color: "#6b7280", marginTop: "0.2rem", display: "inline-block" }}>
                            Category: {item.category || "General"}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem", color: "#374151" }}>{item.authors || "Confidential (Blind Review)"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{item.track || item.institution || "-"}</div>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : "Recent"}
                        </td>
                        <td>
                          {isCompleted ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 700 }}>
                              <CheckCircle2 size={13} /> Completed ({item.total_score || 0} pts)
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "#fffbeb", color: "#d97706", fontSize: "0.75rem", fontWeight: 700 }}>
                              <Clock size={13} /> Pending Review
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className={isCompleted ? "admin-secondary-button" : "admin-primary-button"}
                            style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600 }}
                            onClick={() => openReviewModal(item)}
                          >
                            {isCompleted ? "Update Review" : "Review Abstract"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Review Evaluation Modal */}
        {activeReviewModal && (
          <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
            <div className="admin-panel" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", margin: 0, padding: "2rem", borderRadius: "1.25rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6C4AB6", textTransform: "uppercase" }}>
                    Abstract Evaluation Form
                  </span>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0 0", color: "#111827" }}>
                    {activeReviewModal.title}
                  </h2>
                </div>
                <button type="button" className="admin-icon-button" onClick={() => setActiveReviewModal(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Abstract Summary Box */}
              <div style={{ background: "#f9fafb", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                  <div><strong>Category:</strong> <span style={{ textTransform: "capitalize" }}>{activeReviewModal.category || "General"}</span></div>
                  <div><strong>Track:</strong> <span>{activeReviewModal.track || "Health Conclave"}</span></div>
                  <div><strong>Institution:</strong> <span>{activeReviewModal.institution || "Confidential"}</span></div>
                  <div><strong>Authors:</strong> <span>{activeReviewModal.authors || "Confidential"}</span></div>
                </div>

                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e5e7eb" }}>
                  <strong style={{ fontSize: "0.85rem", color: "#374151" }}>Abstract Content:</strong>
                  <p style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.5, margin: "0.4rem 0 0 0", maxHeight: "150px", overflowY: "auto", whiteSpace: "pre-line" }}>
                    {activeReviewModal.abstract_text || "No abstract text preview available. Please refer to attached document."}
                  </p>
                </div>

                {(activeReviewModal.file_url || activeReviewModal.pdf_url) && (
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <strong style={{ fontSize: "0.85rem", color: "#374151" }}>Attached Research Document:</strong>
                      <a
                        href={apiUrl(activeReviewModal.file_url || activeReviewModal.pdf_url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, color: "#6C4AB6", textDecoration: "none" }}
                      >
                        Open in New Tab <ExternalLink size={12} />
                      </a>
                    </div>
                    <div style={{ height: "360px", border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden", background: "#f8fafc" }}>
                      <iframe
                        src={apiUrl(activeReviewModal.file_url || activeReviewModal.pdf_url)}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title="Attached Research Document"
                      />
                    </div>
                  </div>
                )}
              </div>

              {reviewSuccessMsg ? (
                <div style={{ padding: "2rem", textAlign: "center", background: "#ecfdf5", borderRadius: "0.75rem", color: "#065f46" }}>
                  <CheckCircle2 size={36} style={{ margin: "0 auto 0.5rem" }} />
                  <h3 style={{ margin: 0, fontWeight: 700 }}>{reviewSuccessMsg}</h3>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#111827" }}>
                    Scoring Criteria (1 - 10 Points Each)
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Scientific Merit ({reviewForm.scientificMerit}/10)</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reviewForm.scientificMerit}
                        onChange={(e) => setReviewForm({ ...reviewForm, scientificMerit: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#6C4AB6", marginTop: "0.4rem" }}
                      />
                    </label>

                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Originality & Novelty ({reviewForm.originality}/10)</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reviewForm.originality}
                        onChange={(e) => setReviewForm({ ...reviewForm, originality: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#6C4AB6", marginTop: "0.4rem" }}
                      />
                    </label>

                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Methodology & Rigor ({reviewForm.methodology}/10)</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reviewForm.methodology}
                        onChange={(e) => setReviewForm({ ...reviewForm, methodology: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#6C4AB6", marginTop: "0.4rem" }}
                      />
                    </label>

                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Presentation Quality ({reviewForm.presentationQuality}/10)</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reviewForm.presentationQuality}
                        onChange={(e) => setReviewForm({ ...reviewForm, presentationQuality: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#6C4AB6", marginTop: "0.4rem" }}
                      />
                    </label>

                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Practical Relevance ({reviewForm.relevance}/10)</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={reviewForm.relevance}
                        onChange={(e) => setReviewForm({ ...reviewForm, relevance: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#6C4AB6", marginTop: "0.4rem" }}
                      />
                    </label>
                  </div>

                  {/* Total Score Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "rgba(108, 74, 182, 0.06)", borderRadius: "0.5rem", marginBottom: "1.25rem" }}>
                    <span style={{ fontWeight: 600, color: "#4b5563", fontSize: "0.9rem" }}>Total Evaluation Score:</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#6C4AB6" }}>{totalCalculatedScore} / 50</span>
                  </div>

                  {/* Recommendation */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                      Final Recommendation
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                      {[
                        { val: "accept", label: "Accept", color: "#10b981", bg: "#ecfdf5" },
                        { val: "revise", label: "Request Revision", color: "#f59e0b", bg: "#fffbeb" },
                        { val: "reject", label: "Reject", color: "#ef4444", bg: "#fef2f2" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, recommendation: opt.val })}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: reviewForm.recommendation === opt.val ? `2px solid ${opt.color}` : "1px solid #e5e7eb",
                            background: reviewForm.recommendation === opt.val ? opt.bg : "#ffffff",
                            color: reviewForm.recommendation === opt.val ? opt.color : "#4b5563",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workflow routing notice */}
                  {reviewForm.recommendation === "revise" ? (
                    <div style={{ padding: "0.75rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.5rem", fontSize: "0.85rem", color: "#92400e", marginBottom: "1.25rem" }}>
                      <strong>Workflow Notice:</strong> Your revision request will be routed to your Team Lead for confirmation before an email with the revision token is dispatched to the author.
                    </div>
                  ) : (
                    <div style={{ padding: "0.75rem 1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.85rem", color: "#475467", marginBottom: "1.25rem" }}>
                      <strong>Workflow Notice:</strong> Your completed score & recommendation will be forwarded to your Team Lead for endorsement before the Chairperson makes the final decision.
                    </div>
                  )}

                  {/* Review Comments */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                      Reviewer Comments & Feedback (Required)
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewForm.comments}
                      onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                      placeholder="Provide specific, constructive observations on the methodology, results, and reasons for your recommendation..."
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => setActiveReviewModal(null)}
                      disabled={submittingReview}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-primary-button"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      disabled={submittingReview}
                    >
                      <Save size={16} /> {submittingReview ? "Submitting..." : "Submit Evaluation"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====================================================
  // RENDER: CHAIRPERSON COMMAND CENTER
  // ====================================================
  return (
    <div className="admin-speakers-page" style={{ maxWidth: "1380px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* Executive Command Center Header */}
      <section className="admin-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "rgba(108, 74, 182, 0.08)", color: "#6C4AB6", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            <Microscope size={14} /> Scientific Command Center
          </div>
          <h1 style={{ margin: "0 0 0.35rem 0", fontSize: "1.85rem", fontWeight: 800 }}>Scientific Dashboard</h1>
          <p className="admin-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
            {greeting}, {firstName}. Manage abstracts, reviewers, evaluations and the scientific programme.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>

          {/* Scientific Team Button */}
          <button
            type="button"
            className="admin-secondary-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.5rem 0.95rem",
              borderRadius: "0.5rem",
              background: activeTab === "team" ? "rgba(108, 74, 182, 0.08)" : "#fff",
              color: activeTab === "team" ? "#6C4AB6" : "#374151",
              borderColor: activeTab === "team" ? "#6C4AB6" : "#d1d5db",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            onClick={() => {
              setActiveTab("team");
              if (onNavigate) onNavigate("scientific-team");
            }}
            title="Manage Scientific Committee Reviewers and Team"
          >
            <Users size={16} /> Scientific Team
          </button>

          <button
            type="button"
            className="admin-primary-button"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.85rem" }}
            onClick={() => openAssignModalForAbstract()}
          >
            <UserPlus size={16} /> Assign Reviews
          </button>

          <button
            type="button"
            className="admin-icon-button"
            title="Refresh Dashboard"
            onClick={loadChairpersonData}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </section>

      {/* Real Top Statistics Grid (8 Metrics directly from MySQL) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.85rem", margin: "1.25rem 0" }}>
        {[
          { label: "Total Abstracts", value: totalAbstracts, icon: FileText, color: "#6C4AB6", bg: "rgba(108,74,182,0.06)", filter: "all" },
          { label: "New Submissions", value: newSubmissions, icon: Sparkles, color: "#2563eb", bg: "rgba(37,99,235,0.06)", filter: "submitted" },
          { label: "Under Review", value: underReview, icon: Clock, color: "#d97706", bg: "rgba(217,119,6,0.06)", filter: "under_review" },
          { label: "Reviews Pending", value: reviewsPending, icon: ClipboardCheck, color: "#e11d48", bg: "rgba(225,29,72,0.06)", filter: "under_review" },
          { label: "Accepted", value: acceptedCount, icon: CheckCircle2, color: "#059669", bg: "rgba(5,150,105,0.06)", filter: "accepted" },
          { label: "Revision Req.", value: revisionCount, icon: RefreshCw, color: "#ea580c", bg: "rgba(234,88,12,0.06)", filter: "revision_requested" },
          { label: "Rejected", value: rejectedCount, icon: X, color: "#dc2626", bg: "rgba(220,38,38,0.06)", filter: "rejected" },
          { label: "Completion", value: `${reviewCompletionRate}%`, icon: Percent, color: "#7c3aed", bg: "rgba(124,58,237,0.06)", filter: "all" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => {
                setAbstractFilter(card.filter);
                setActiveTab("abstracts");
              }}
              className="admin-panel"
              style={{
                cursor: "pointer",
                margin: 0,
                padding: "1rem",
                borderRadius: "1rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                border: "1px solid #f3f4f6",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#f3f4f6";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280" }}>{card.label}</span>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: card.bg, color: card.color, display: "grid", placeItems: "center" }}>
                  <Icon size={15} />
                </div>
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: card.color, letterSpacing: "-0.02em" }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Needs Attention Bar */}
      <section className="admin-panel" style={{ padding: "1.25rem 1.5rem", borderRadius: "1rem", borderLeft: "4px solid #6C4AB6", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(108,74,182,0.1)", color: "#6C4AB6", display: "grid", placeItems: "center" }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block" }}>Action Items & Needs Attention</strong>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                {unassignedCount > 0 ? `${unassignedCount} abstracts need reviewer assignment.` : "All abstracts are assigned to reviewers."}
                {reviewsPending > 0 ? ` • ${reviewsPending} evaluations currently in progress.` : ""}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {unassignedCount > 0 && (
              <button
                type="button"
                className="admin-primary-button"
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
                onClick={() => openAssignModalForAbstract()}
              >
                Assign {unassignedCount} Unassigned <ArrowRight size={14} />
              </button>
            )}
            <button
              type="button"
              className="admin-secondary-button"
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
              onClick={() => {
                setActiveTab("abstracts");
                setAbstractFilter("all");
              }}
            >
              View All Submissions ({abstracts.length})
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              onClick={() => {
                setActiveTab("team");
                if (onNavigate) onNavigate("scientific-team");
              }}
            >
              <Users size={13} /> Scientific Team ({reviewers.length})
            </button>
          </div>
        </div>
      </section>

      {/* Visual Abstract Workflow Pipeline */}
      <section className="admin-panel" style={{ padding: "1.5rem", borderRadius: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Abstract Workflow Pipeline</h2>
            <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
              Live lifecycle state across all submissions. Click any stage to inspect matching abstracts.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", position: "relative" }}>
          {[
            { stage: "SUBMITTED", count: newSubmissions, color: "#2563eb", desc: "Awaiting assignment", filter: "submitted" },
            { stage: "ASSIGNED", count: rawStats.totalAssignments || 0, color: "#8b5cf6", desc: "Allocated to reviewers", filter: "all" },
            { stage: "UNDER REVIEW", count: underReview, color: "#d97706", desc: "Active evaluations", filter: "under_review" },
            { stage: "REVISION", count: revisionCount, color: "#ea580c", desc: "Author updating", filter: "revision_requested" },
            { stage: "ACCEPTED", count: acceptedCount, color: "#059669", desc: "Approved for GHC", filter: "accepted" },
            { stage: "REJECTED", count: rejectedCount, color: "#dc2626", desc: "Declined", filter: "rejected" },
          ].map((item, idx) => (
            <div
              key={item.stage}
              onClick={() => {
                setAbstractFilter(item.filter);
                setActiveTab("abstracts");
              }}
              style={{
                cursor: "pointer",
                padding: "1rem",
                borderRadius: "0.75rem",
                background: "#fafafa",
                border: "1px solid #e5e7eb",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: item.color, letterSpacing: "0.05em" }}>
                  {item.stage}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Stage {idx + 1}</span>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
                {item.count}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.3rem", display: "block" }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Chairperson Section Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
        {[
          { id: "overview", label: "Reviewer Workload & Activity", icon: Users },
          { id: "abstracts", label: `All Submitted Abstracts (${abstracts.length})`, icon: FileText },
          { id: "abstract-report", label: `Abstract Report (${abstractReviews.length})`, icon: ClipboardCheck },
          { id: "rankings", label: "Abstract Rankings", icon: Trophy },
          { id: "team", label: `Scientific Team (${reviewers.length})`, icon: Users },
          { id: "reports", label: "Scientific Reports & Trends", icon: TrendingUp },
          { id: "settings", label: "Submission & Review Settings", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (onNavigate) {
                  if (tab.id === "team") onNavigate("scientific-team");
                  else if (tab.id === "abstract-report") onNavigate("abstract-report");
                  else if (tab.id === "rankings") onNavigate("abstract-rankings");
                  else if (tab.id === "overview") onNavigate("scientific");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.75rem 1.25rem",
                border: "none",
                background: "transparent",
                borderBottom: isSelected ? "3px solid #6C4AB6" : "3px solid transparent",
                color: isSelected ? "#6C4AB6" : "#6b7280",
                fontWeight: isSelected ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Reviewer Workload & Activity */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "start" }}>
          {/* Reviewer Workload Table */}
          <section className="admin-panel" style={{ margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Reviewer Workload & Velocity</h2>
                <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
                  Monitor allocation, pending evaluations, and completion rate across committee reviewers.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  onClick={() => {
                    setActiveTab("team");
                    if (onNavigate) onNavigate("scientific-team");
                  }}
                >
                  <Users size={14} /> Scientific Team
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  onClick={() => openAssignModalForAbstract()}
                >
                  <UserPlus size={14} /> Assign New Work
                </button>
              </div>
            </div>

            {reviewers.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "#6b7280" }}>
                <Users size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No scientific reviewers registered yet in the reviewers directory.</p>
              </div>
            ) : (
              <div className="speaker-table-wrap">
                <table className="speaker-table">
                  <thead>
                    <tr>
                      <th>Reviewer</th>
                      <th>Team &amp; Designation</th>
                      <th style={{ textAlign: "center" }}>Assigned</th>
                      <th style={{ textAlign: "center" }}>Completed</th>
                      <th style={{ textAlign: "center" }}>Pending</th>
                      <th>Progress</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewers.map((rev) => {
                      const assigned = Number(rev.assigned_count || 0);
                      const completed = Number(rev.completed_reviews || 0);
                      const pending = Math.max(0, assigned - completed);
                      const completion = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
                      return (
                        <tr key={rev.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#111827" }}>{rev.name}</div>
                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{rev.email}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.85rem", color: "#374151" }}>{rev.team_name || "Unassigned"}</div>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{rev.team_designation === "LEAD" ? "Lead" : rev.team_designation === "MEMBER" ? "Member" : "No team designation"}</span>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{assigned}</td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "#059669" }}>{completed}</td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: pending > 3 ? "#dc2626" : "#d97706" }}>
                            {pending}
                          </td>
                          <td style={{ width: "120px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ flex: 1, height: "6px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${completion}%`, background: "#6C4AB6", borderRadius: "999px" }} />
                              </div>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280" }}>{completion}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="admin-secondary-button"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                              onClick={() => {
                                openAssignModalForAbstract();
                              }}
                            >
                              Assign Reviews
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Scientific Activity */}
          <section className="admin-panel" style={{ margin: 0 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0" }}>Recent Scientific Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {(statsData.recentActivity || []).length === 0 ? (
                <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem" }}>No recent activity logs recorded yet.</p>
              ) : (
                (statsData.recentActivity || []).slice(0, 8).map((act) => (
                  <div key={act.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.85rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6C4AB6", marginTop: "0.4rem", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#111827", textTransform: "capitalize" }}>
                        {(act.action || "").replaceAll("_", " ")}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        {act.timestamp ? new Date(act.timestamp).toLocaleString() : "Just now"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: All Submitted Abstracts */}
      {activeTab === "abstracts" && (
        <section className="admin-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>All Submitted Abstracts ({abstracts.length})</h2>
              <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
                Complete list of all research abstracts received from authors.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ fontSize: "0.85rem" }}
                onClick={() => openAssignModalForAbstract()}
              >
                <UserPlus size={15} /> Assign Selected
              </button>
              <button
                type="button"
                className="admin-primary-button"
                style={{ fontSize: "0.85rem" }}
                onClick={() => onNavigate("research")}
              >
                Open Full Abstract Management <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Search and Status Filter Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {[
                { id: "all", label: `All (${abstracts.length})` },
                { id: "unassigned_team", label: `⚠️ Needs Team Assignment (${unassignedTeamCount})` },
                { id: "lead_approved", label: `⭐ Awaiting Verdict (${leadApprovedCount})` },
                { id: "under_review", label: `Under Review (${underReview})` },
                { id: "revision_requested", label: `Revisions (${revisionCount})` },
                { id: "accepted", label: `Accepted (${acceptedCount})` },
                { id: "rejected", label: `Rejected (${rejectedCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAbstractFilter(f.id)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    border: abstractFilter === f.id ? "1px solid #6C4AB6" : "1px solid #e5e7eb",
                    background: abstractFilter === f.id ? "rgba(108,74,182,0.08)" : "#ffffff",
                    color: abstractFilter === f.id ? "#6C4AB6" : "#4b5563",
                    fontWeight: abstractFilter === f.id ? 700 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Search title, author, institution..."
                value={abstractSearch}
                onChange={(e) => setAbstractSearch(e.target.value)}
                style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "260px" }}
              />
            </div>
          </div>

          {filteredAbstracts.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
              <FileText size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No abstracts match the selected filter.</p>
            </div>
          ) : (
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title of Research</th>
                    <th>Presenting Author</th>
                    <th>Reviewer Team</th>
                    <th>Assigned Reviewer</th>
                    <th>Workflow Stage</th>
                    <th>Score</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbstracts.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.06)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                          {sub.abstractId || `GHC-ABS-${String(sub.id).padStart(5, "0")}`}
                        </span>
                      </td>
                      <td>
                        <strong title={sub.title} style={{ color: "#111827", maxWidth: "280px", display: "block" }}>
                          {sub.title}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{sub.category || "Poster"} • {sub.track || "Scientific Track"}</span>
                      </td>
                      <td>
                        <div>{sub.presentingAuthor || sub.correspondingAuthor || sub.authors || "Not specified"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{sub.institution || "GAIMS"}</span>
                      </td>
                      <td>
                        {sub.teamName ? (
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6C4AB6", background: "rgba(108,74,182,0.08)", padding: "0.2rem 0.6rem", borderRadius: "999px", display: "inline-block" }}>
                            👥 {sub.teamName}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontStyle: "italic" }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {sub.assignedReviewerName ? (
                          <span style={{ fontWeight: 600, color: "#374151" }}>{sub.assignedReviewerName}</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontStyle: "italic" }}>-</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "capitalize",
                            background:
                              sub.workflowStage === "accepted" || sub.status === "accepted" ? "#ecfdf5" :
                              sub.workflowStage === "rejected" || sub.status === "rejected" ? "#fef2f2" :
                              sub.workflowStage === "lead_approved" ? "#fef3c7" :
                              sub.workflowStage === "lead_revision_requested" ? "#fff7ed" :
                              sub.workflowStage === "reviewer_reviewed" ? "#faf5ff" :
                              sub.workflowStage === "assigned_to_reviewer" ? "#eff6ff" :
                              sub.workflowStage === "assigned_to_team" ? "#f0fdf4" :
                              sub.status === "revision_requested" ? "#fff7ed" : "#f3f4f6",
                            color:
                              sub.workflowStage === "accepted" || sub.status === "accepted" ? "#059669" :
                              sub.workflowStage === "rejected" || sub.status === "rejected" ? "#dc2626" :
                              sub.workflowStage === "lead_approved" ? "#b45309" :
                              sub.workflowStage === "lead_revision_requested" ? "#c2410c" :
                              sub.workflowStage === "reviewer_reviewed" ? "#7c3aed" :
                              sub.workflowStage === "assigned_to_reviewer" ? "#2563eb" :
                              sub.workflowStage === "assigned_to_team" ? "#16a34a" :
                              sub.status === "revision_requested" ? "#ea580c" : "#4b5563",
                          }}
                        >
                          {sub.workflowStage === "lead_approved" ? "⭐ Awaiting Verdict" :
                           sub.workflowStage === "lead_revision_requested" ? "⚠️ Revision Flagged" :
                           sub.workflowStage === "reviewer_reviewed" ? "Reviewed (Awaiting Lead)" :
                           sub.workflowStage === "assigned_to_reviewer" ? "Under Review" :
                           sub.workflowStage === "assigned_to_team" ? "Assigned to Team" :
                           sub.workflowStage === "submitted" || !sub.teamId ? "Needs Team" :
                           (sub.workflowStage || sub.status || "submitted").replaceAll("_", " ")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {sub.finalScore !== null && sub.finalScore !== undefined ? `${sub.finalScore} / 50` : "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                          {!sub.teamId && (
                            <button
                              type="button"
                              className="admin-secondary-button"
                              style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, color: "#d97706", borderColor: "#fde68a" }}
                              onClick={() => openAssignModalForAbstract(sub)}
                              title="Assign to a Reviewer Team"
                            >
                              Assign Team
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-secondary-button"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#6C4AB6", borderColor: "#d8b4fe", background: "rgba(108,74,182,0.04)" }}
                            onClick={() => openAbstractDetail(sub)}
                            title="View Abstract in Website"
                          >
                            <Eye size={13} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB: Abstract Report (Reviewer Evaluations) */}
      {activeTab === "abstract-report" && (
        <section className="admin-panel" style={{ marginTop: "1rem", padding: "1.5rem 1.75rem", borderRadius: "1rem", overflow: "visible" }}>
          {/* Header & Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(108,74,182,0.08)", color: "#6C4AB6", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>
                <ClipboardCheck size={13} /> Reviewer Evaluation Submissions
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#111827", letterSpacing: "-0.01em" }}>
                Abstract Report ({abstractReviews.length})
              </h2>
              <p className="admin-muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                Live record of all evaluations, scores, and feedback submitted by scientific reviewers.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}
                onClick={handleExportReviewsCsv}
                disabled={abstractReviews.length === 0}
                title="Download complete report of all reviews as CSV"
              >
                <Download size={15} /> Export CSV Report
              </button>

              <button
                type="button"
                className="admin-secondary-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
                onClick={loadChairpersonData}
                title="Refresh Review Data"
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.85rem", padding: "0.85rem 1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Total Reviews Sent</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#111827", marginTop: "0.25rem" }}>{totalReviewsCount}</div>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "0.2rem" }}>Across all active abstracts</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #dcfce7", borderRadius: "0.85rem", padding: "0.85rem 1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>Recommended Accept</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#16a34a", marginTop: "0.25rem" }}>{acceptCount}</div>
              <div style={{ fontSize: "0.72rem", color: "#15803d", marginTop: "0.2rem" }}>{totalReviewsCount ? `${Math.round((acceptCount / totalReviewsCount) * 100)}% of submitted` : "-"}</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #fef3c7", borderRadius: "0.85rem", padding: "0.85rem 1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Revisions Requested</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>{reviseCount}</div>
              <div style={{ fontSize: "0.72rem", color: "#b45309", marginTop: "0.2rem" }}>Needs author updates</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #fee2e2", borderRadius: "0.85rem", padding: "0.85rem 1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>Recommended Reject</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#dc2626", marginTop: "0.25rem" }}>{rejectCount}</div>
              <div style={{ fontSize: "0.72rem", color: "#b91c1c", marginTop: "0.2rem" }}>Did not meet criteria</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #ede9fe", borderRadius: "0.85rem", padding: "0.85rem 1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6C4AB6", textTransform: "uppercase" }}>Average Score</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#6C4AB6", marginTop: "0.25rem" }}>{formatScore(avgReviewScore)} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#9ca3af" }}>/ 50</span></div>
              <div style={{ fontSize: "0.72rem", color: "#6C4AB6", marginTop: "0.2rem" }}>Calculated across reviews</div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "420px" }}>
              <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search by abstract title, code, reviewer, keyword..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 2rem 0.55rem 2.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
              {reviewSearch && (
                <button
                  type="button"
                  onClick={() => setReviewSearch("")}
                  style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {[
                { id: "all", label: `All Reviews (${totalReviewsCount})` },
                { id: "accept", label: `Accept (${acceptCount})`, color: "#16a34a" },
                { id: "revise", label: `Revise (${reviseCount})`, color: "#d97706" },
                { id: "reject", label: `Reject (${rejectCount})`, color: "#dc2626" },
              ].map((pill) => {
                const isSelected = reviewFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setReviewFilter(pill.id)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? `1px solid ${pill.color || "#6C4AB6"}` : "1px solid #e5e7eb",
                      background: isSelected ? (pill.color ? `${pill.color}15` : "rgba(108,74,182,0.1)") : "#ffffff",
                      color: isSelected ? (pill.color || "#6C4AB6") : "#4b5563",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviews Table */}
          {filteredAbstractReviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#f9fafb", borderRadius: "0.75rem", border: "1px dashed #d1d5db" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(108,74,182,0.08)", color: "#6C4AB6", display: "grid", placeItems: "center", margin: "0 auto 0.75rem auto" }}>
                <ClipboardCheck size={24} />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#111827" }}>
                No reviewer evaluations found
              </h3>
              <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem", maxWidth: "450px", marginLeft: "auto", marginRight: "auto" }}>
                {reviewSearch || reviewFilter !== "all"
                  ? "No reviews match your search query or selected recommendation filter."
                  : "Reviewers have not submitted any reviews yet. Assigned reviewers will have their evaluations recorded here once completed."}
              </p>
              {(reviewSearch || reviewFilter !== "all") && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setReviewSearch("");
                    setReviewFilter("all");
                  }}
                  style={{ marginTop: "1rem", fontSize: "0.8rem" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <table className="admin-table" style={{ width: "100%", minWidth: "960px", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563" }}>Abstract</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563" }}>Reviewer</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563" }}>Recommendation</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563" }}>Total Score</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563" }}>Reviewer Feedback</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563" }}>Reviewed On</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4b5563", textAlign: "center", width: "175px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbstractReviews.map((rev) => {
                    const rec = rev.recommendation?.toLowerCase();
                    const isAccept = rec === "accept";
                    const isReject = rec === "reject";
                    const isRevise = rec === "revise";
                    return (
                      <tr key={rev.id} style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                        {/* Abstract details */}
                        <td style={{ padding: "0.85rem 1rem", maxWidth: "240px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.08)", padding: "0.15rem 0.5rem", borderRadius: "999px", display: "inline-block", marginBottom: "0.25rem" }}>
                            {rev.abstractCode || `GHC-ABS-${String(rev.abstract_id).padStart(5, "0")}`}
                          </span>
                          <div style={{ fontWeight: 700, color: "#111827", lineHeight: 1.3, marginBottom: "0.2rem" }}>
                            {rev.title || `Abstract #${rev.abstract_id}`}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {rev.category || "General"} {rev.track ? `• ${rev.track}` : ""}
                          </span>
                        </td>

                        {/* Reviewer details */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>
                            {rev.reviewer_name || "Reviewer"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {rev.reviewer_email || "-"}
                          </div>
                          {rev.specialization && (
                            <span style={{ fontSize: "0.7rem", color: "#6C4AB6", background: "rgba(108,74,182,0.06)", padding: "0.1rem 0.45rem", borderRadius: "4px", display: "inline-block", marginTop: "0.2rem" }}>
                              {rev.specialization}
                            </span>
                          )}
                        </td>

                        {/* Recommendation badge */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: isAccept ? "#dcfce7" : isReject ? "#fee2e2" : isRevise ? "#fef3c7" : "#f3f4f6",
                            color: isAccept ? "#15803d" : isReject ? "#b91c1c" : isRevise ? "#b45309" : "#4b5563",
                            textTransform: "capitalize",
                          }}>
                            {isAccept && <CheckCircle2 size={13} />}
                            {isRevise && <RefreshCw size={12} />}
                            {isReject && <X size={13} />}
                            {rev.recommendation || "Pending"}
                          </span>
                        </td>

                        {/* Total Score & breakdown hint */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "baseline", gap: "0.2rem" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>
                              {formatScore(rev.total_score)}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>/ 50</span>
                          </div>
                          <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem", fontSize: "0.65rem", color: "#6b7280" }}>
                            <span title="Scientific Merit">M:{formatScore(rev.scientific_merit)}</span>
                            <span>•</span>
                            <span title="Originality">O:{formatScore(rev.originality)}</span>
                            <span>•</span>
                            <span title="Methodology">Me:{formatScore(rev.methodology)}</span>
                            <span>•</span>
                            <span title="Quality">Q:{formatScore(rev.presentation_quality)}</span>
                            <span>•</span>
                            <span title="Relevance">R:{formatScore(rev.relevance)}</span>
                          </div>
                        </td>

                        {/* Reviewer comments / Rejection reasons preview */}
                        <td style={{ padding: "0.85rem 1rem", minWidth: "220px", maxWidth: "320px" }}>
                          {isReject ? (
                            <div style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: "0.5rem",
                              padding: "0.55rem 0.75rem",
                              fontSize: "0.8rem",
                              color: "#991b1b",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "0.25rem", color: "#b91c1c" }}>
                                <AlertCircle size={13} /> Rejection Reason:
                              </div>
                              <div style={{
                                lineHeight: 1.45,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                whiteSpace: "pre-wrap",
                                fontWeight: 500,
                              }}>
                                {rev.comments || rev.review_notes || "Does not meet conference publication standards."}
                              </div>
                              {(() => {
                                const flags = [];
                                if (rev.scientific_merit !== null && Number(rev.scientific_merit) < 6) flags.push(`Merit: ${formatScore(rev.scientific_merit)}/10`);
                                if (rev.originality !== null && Number(rev.originality) < 6) flags.push(`Originality: ${formatScore(rev.originality)}/10`);
                                if (rev.methodology !== null && Number(rev.methodology) < 6) flags.push(`Methodology: ${formatScore(rev.methodology)}/10`);
                                if (rev.presentation_quality !== null && Number(rev.presentation_quality) < 6) flags.push(`Quality: ${formatScore(rev.presentation_quality)}/10`);
                                if (rev.relevance !== null && Number(rev.relevance) < 6) flags.push(`Relevance: ${formatScore(rev.relevance)}/10`);
                                return flags.length > 0 ? (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.35rem" }}>
                                    {flags.map((f) => (
                                      <span key={f} style={{ fontSize: "0.65rem", fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "0.1rem 0.35rem", borderRadius: "3px" }}>
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          ) : isRevise ? (
                            <div style={{
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              borderRadius: "0.5rem",
                              padding: "0.55rem 0.75rem",
                              fontSize: "0.8rem",
                              color: "#92400e",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "0.25rem", color: "#d97706" }}>
                                <RefreshCw size={12} /> Revision Requirements:
                              </div>
                              <div style={{
                                lineHeight: 1.45,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                whiteSpace: "pre-wrap",
                                fontWeight: 500,
                              }}>
                                {rev.comments || "Author revisions requested before decision."}
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              fontSize: "0.8rem",
                              color: "#374151",
                              background: "#f9fafb",
                              padding: "0.45rem 0.65rem",
                              borderRadius: "0.4rem",
                              border: "1px solid #f3f4f6",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: 1.4,
                            }}>
                              "{rev.comments || "Met evaluation criteria."}"
                            </div>
                          )}
                        </td>

                        {/* Reviewed Date */}
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6b7280" }}>
                          {rev.reviewed_at ? (
                            <>
                              <div>{new Date(rev.reviewed_at).toLocaleDateString()}</div>
                              <div style={{ color: "#9ca3af" }}>{new Date(rev.reviewed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Actions: 2x2 Clean Grid */}
                        <td style={{ padding: "0.85rem 0.75rem", width: "175px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", width: "165px", margin: "0 auto" }}>
                            {/* 1. View Abstract in Website */}
                            <button
                              type="button"
                              className="admin-secondary-button"
                              style={{
                                padding: "0.35rem 0.4rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                                color: "#6C4AB6",
                                borderColor: "#d8b4fe",
                                background: "rgba(108,74,182,0.06)",
                                borderRadius: "0.4rem",
                              }}
                              onClick={() => handleOpenAbstractFromReview(rev)}
                              title="View full abstract in website reader"
                            >
                              <Eye size={12} /> View
                            </button>

                            {/* 2. Inspect Review */}
                            <button
                              type="button"
                              className="admin-secondary-button"
                              style={{
                                padding: "0.35rem 0.4rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                                color: "#374151",
                                borderColor: "#e5e7eb",
                                background: "#f9fafb",
                                borderRadius: "0.4rem",
                              }}
                              onClick={() => setSelectedReviewDetail(rev)}
                              title="Inspect review scores and evaluator feedback"
                            >
                              <ClipboardCheck size={12} /> Inspect
                            </button>

                            {/* 3. Download Research */}
                            {(rev.pdf_url || rev.file_url) ? (
                              <a
                                href={apiUrl(rev.pdf_url || rev.file_url)}
                                download
                                className="admin-secondary-button"
                                style={{
                                  padding: "0.35rem 0.4rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "0.25rem",
                                  textDecoration: "none",
                                  color: "#4b5563",
                                  borderColor: "#e5e7eb",
                                  background: "#ffffff",
                                  borderRadius: "0.4rem",
                                }}
                                title="Download research paper document"
                              >
                                <Download size={12} /> File
                              </a>
                            ) : (
                              <button
                                disabled
                                type="button"
                                className="admin-secondary-button"
                                style={{
                                  padding: "0.35rem 0.4rem",
                                  fontSize: "0.75rem",
                                  color: "#9ca3af",
                                  borderColor: "#f3f4f6",
                                  background: "#fafafa",
                                  borderRadius: "0.4rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "0.25rem",
                                  opacity: 0.5,
                                  cursor: "not-allowed",
                                }}
                                title="No document file attached"
                              >
                                <Download size={12} /> File
                              </button>
                            )}

                            {/* 4. Action button for Revision */}
                            <button
                              type="button"
                              className="admin-secondary-button"
                              style={{
                                padding: "0.35rem 0.4rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                                color: "#d97706",
                                borderColor: "#fde68a",
                                background: "#fffbeb",
                                borderRadius: "0.4rem",
                              }}
                              onClick={() => handleOpenRevisionModal(rev)}
                              title="Request revisions from author via email"
                            >
                              <Send size={11} /> Revise
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB: Abstract Rankings */}
      {activeTab === "rankings" && (
        <section className="admin-panel" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Abstract Rankings</h2>
              <p className="admin-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                Official position is calculated server-side from finalized reviewer scores. Ties use competition ranking.
              </p>
            </div>
            <button type="button" className="admin-primary-button" onClick={handleExportRankings} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
              <Download size={16} /> Export Rankings
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.85rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Eligible Abstracts", value: rankingsData.summary?.totalEligible ?? 0, icon: FileCheck, color: "#6C4AB6" },
              { label: "Highest Score", value: formatScore(rankingsData.summary?.highestScore), icon: Trophy, color: "#059669" },
              { label: "Average Score", value: formatScore(rankingsData.summary?.averageScore), icon: TrendingUp, color: "#2563eb" },
              { label: "Lowest Score", value: formatScore(rankingsData.summary?.lowestScore), icon: Layers, color: "#d97706" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: "0.85rem", padding: "1rem", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>{card.label}</span>
                    <Icon size={17} color={card.color} />
                  </div>
                  <strong style={{ fontSize: "1.55rem", color: card.color }}>{card.value}</strong>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            <label>Search<input value={rankingFilters.search} onChange={(e) => updateRankingFilter("search", e.target.value)} placeholder="ID, title, applicant, institution" /></label>
            <label>Category<select value={rankingFilters.category} onChange={(e) => updateRankingFilter("category", e.target.value)}><option value="all">All categories</option>{[...new Set(abstracts.map((a) => a.category).filter(Boolean))].map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label>UG / PG<select value={rankingFilters.ugPg} onChange={(e) => updateRankingFilter("ugPg", e.target.value)}><option value="all">All levels</option><option value="ug">UG</option><option value="pg">PG</option><option value="intern">Intern</option></select></label>
            <label>Review status<select value={rankingFilters.reviewStatus} onChange={(e) => updateRankingFilter("reviewStatus", e.target.value)}><option value="fully_reviewed">Fully Reviewed</option><option value="pending_review">Pending Review</option><option value="all">All Abstracts</option></select></label>
            <label>Abstract status<select value={rankingFilters.status} onChange={(e) => updateRankingFilter("status", e.target.value)}><option value="all">All statuses</option>{["submitted", "under_review", "revision_requested", "revised_submitted", "accepted", "rejected"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
            <label>Institution<input value={rankingFilters.institution} onChange={(e) => updateRankingFilter("institution", e.target.value)} placeholder="Filter institution" /></label>
            <label>Min score<input type="number" min="0" max="50" value={rankingFilters.scoreMin} onChange={(e) => updateRankingFilter("scoreMin", e.target.value)} /></label>
            <label>Max score<input type="number" min="0" max="50" value={rankingFilters.scoreMax} onChange={(e) => updateRankingFilter("scoreMax", e.target.value)} /></label>
            <label>Display sort<select value={rankingFilters.sort} onChange={(e) => updateRankingFilter("sort", e.target.value)}><option value="position">Official position</option><option value="score">Score</option><option value="category">Category</option><option value="ugPg">UG/PG</option><option value="institution">Institution</option><option value="reviewStatus">Review status</option></select></label>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "0.8rem 1rem", fontSize: "0.82rem", color: "#475569", marginBottom: "1rem" }}>
            <strong>Ranking method:</strong> {rankingsData.summary?.rankingMethod || "Average of submitted reviewer total scores"}. <strong>Tie handling:</strong> {rankingsData.summary?.tieHandling || "Competition ranking."}
          </div>

          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead><tr><th>Position</th><th>Abstract</th><th>Applicant</th><th>Institution</th><th>Category</th><th>UG/PG</th><th>Score</th><th>%</th><th>Review Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rankingLoading && <tr><td colSpan="10">Loading rankings...</td></tr>}
                {!rankingLoading && rankingsData.rankings?.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.position || "-"}</strong></td>
                    <td><strong>{row.abstractId || `GHC-ABS-${String(row.id).padStart(5, "0")}`}</strong><br /><span className="admin-muted">{row.title}</span></td>
                    <td>{row.applicantName || "-"}</td>
                    <td>{row.institution || "-"}</td>
                    <td><span className="status-pill">{row.category || "-"}</span></td>
                    <td>{row.yearOfStudy || "-"}</td>
                    <td><strong>{row.finalScore !== null && row.finalScore !== undefined ? `${formatScore(row.finalScore)} / ${row.maximumScore || 50}` : "-"}</strong></td>
                    <td>{row.percentage !== null && row.percentage !== undefined ? `${formatScore(row.percentage)}%` : "-"}</td>
                    <td><span className={`status-pill ${row.reviewStatus === "fully_reviewed" ? "paid" : "pending"}`}>{String(row.reviewStatus || "").replaceAll("_", " ")}</span></td>
                    <td><button type="button" className="admin-secondary-button" onClick={() => handleOpenRankingAbstract(row)}><Eye size={15} /> View</button></td>
                  </tr>
                ))}
                {!rankingLoading && !rankingsData.rankings?.length && <tr><td colSpan="10">No abstracts match the current ranking filters.</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <span className="admin-muted">Showing page {rankingsData.pagination?.page || 1} of {rankingsData.pagination?.totalPages || 1} ({rankingsData.pagination?.total || 0} rows)</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="admin-secondary-button" disabled={(rankingsData.pagination?.page || 1) <= 1} onClick={() => setRankingFilters((current) => ({ ...current, page: Math.max(1, Number(current.page || 1) - 1) }))}>Previous</button>
              <button type="button" className="admin-secondary-button" disabled={(rankingsData.pagination?.page || 1) >= (rankingsData.pagination?.totalPages || 1)} onClick={() => setRankingFilters((current) => ({ ...current, page: Number(current.page || 1) + 1 }))}>Next</button>
            </div>
          </div>
        </section>
      )}

      {/* TAB: Scientific Committee Reviewers Team */}
      {activeTab === "team" && (
        <ReviewerTeams
          api={api}
          user={user}
          onReviewerUpdated={loadChairpersonData}
        />
      )}

      {/* TAB 3: Scientific Reports */}
      {activeTab === "reports" && (
        <section className="admin-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Scientific Analytics & Submission Breakdown</h2>
              <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>Real metrics aggregated from research submissions and review scores.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {Object.entries(reportsData).map(([chartKey, dataPoints]) => (
              <div key={chartKey} style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #e5e7eb" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#111827", textTransform: "capitalize" }}>
                  {chartKey.replace(/([A-Z])/g, " $1")}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {dataPoints && dataPoints.length > 0 ? (
                    dataPoints.map((dp) => (
                      <div key={dp.label} style={{ fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span style={{ color: "#374151" }}>{dp.label}</span>
                          <strong style={{ color: "#6C4AB6" }}>{dp.value}</strong>
                        </div>
                        <div style={{ height: "6px", width: "100%", background: "#f3f4f6", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, Number(dp.value) * 10)}%`, background: "#6C4AB6", borderRadius: "999px" }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="admin-muted" style={{ fontSize: "0.85rem", margin: 0 }}>No chart data available.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: Submission & Review Settings */}
      {activeTab === "settings" && (
        <section className="admin-panel" style={{ maxWidth: "780px" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Scientific Submission Settings</h2>
            <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
              Configure public abstract submission windows, file limits, guidelines, and evaluation criteria.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="super-form-grid">
            <label>
              Submission Start Date
              <input
                type="date"
                value={settings.submissionStartDate || ""}
                onChange={(e) => setSettings({ ...settings, submissionStartDate: e.target.value })}
              />
            </label>

            <label>
              Submission End Date (Deadline)
              <input
                type="date"
                value={settings.submissionEndDate || ""}
                onChange={(e) => setSettings({ ...settings, submissionEndDate: e.target.value })}
              />
            </label>

            <label>
              Maximum Authors per Abstract
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxAuthors || 6}
                onChange={(e) => setSettings({ ...settings, maxAuthors: Number(e.target.value) })}
              />
            </label>

            <label>
              Maximum File Size (MB)
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxFileSize || 10}
                onChange={(e) => setSettings({ ...settings, maxFileSize: Number(e.target.value) })}
              />
            </label>

            <label>
              Review Mode
              <select
                value={settings.reviewMode || "double_blind"}
                onChange={(e) => setSettings({ ...settings, reviewMode: e.target.value })}
              >
                <option value="double_blind">Double-Blind (Authors & Reviewers Anonymous)</option>
                <option value="single_blind">Single-Blind (Reviewers see Authors)</option>
                <option value="open">Open Review</option>
              </select>
            </label>

            <label>
              Allowed File Formats
              <input
                value={settings.allowedFileTypes || "pdf, docx"}
                onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                placeholder="e.g. pdf, docx"
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              Abstract Template URL (Public Download)
              <input
                value={settings.templateUrl || ""}
                onChange={(e) => setSettings({ ...settings, templateUrl: e.target.value })}
                placeholder="https://example.com/template.docx"
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              Author Guidelines & Instructions
              <textarea
                rows={4}
                value={settings.guidelines || ""}
                onChange={(e) => setSettings({ ...settings, guidelines: e.target.value })}
                placeholder="Guidelines displayed to authors on the abstract submission page..."
              />
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" className="admin-primary-button" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <Save size={16} /> Save Scientific Settings
              </button>
              {settingsStatus === "saved" && <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.85rem" }}>✓ Settings saved successfully.</span>}
              {settingsStatus === "error" && <span style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.85rem" }}>Failed to save settings.</span>}
            </div>
          </form>
        </section>
      )}

      {/* Review Assignment Workflow Modal (Assign to Reviewer Team) */}
      {assignModalOpen && (
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "1rem",
          }}
        >
          <div
            className="admin-panel"
            style={{
              width: "100%",
              maxWidth: "860px",
              maxHeight: "92vh",
              overflowY: "auto",
              margin: 0,
              padding: "2rem",
              borderRadius: "1.25rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              background: "#ffffff",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "999px",
                    background: "rgba(108,74,182,0.08)",
                    color: "#6C4AB6",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                  }}
                >
                  <Users size={13} /> Scientific Workflow Allocation
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#111827" }}>
                  Assign Abstracts to Reviewer Team
                </h2>
                <p className="admin-muted" style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem" }}>
                  Select the abstracts below and click on a <strong>Reviewer Team</strong>. The abstracts will instantly land in that <strong>Team Leader's dashboard</strong> for reviewer assignment.
                </p>
              </div>
              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setAssignModalOpen(false)}
                disabled={assigningTeamId !== null}
              >
                <X size={20} />
              </button>
            </div>

            {/* SECTION 1: Select Abstracts */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "0.6rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#374151" }}>
                    1. Select Abstracts to Assign
                  </label>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.6rem",
                      borderRadius: "999px",
                      background: selectedAbstracts.length > 0 ? "#ede9fe" : "#f3f4f6",
                      color: selectedAbstracts.length > 0 ? "#6C4AB6" : "#6b7280",
                    }}
                  >
                    {selectedAbstracts.length} selected
                  </span>
                </div>

                {/* Filter and Search */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      type="button"
                      onClick={() => setAssignFilter("unassigned")}
                      style={{
                        padding: "0.25rem 0.55rem",
                        fontSize: "0.75rem",
                        fontWeight: assignFilter === "unassigned" ? 700 : 500,
                        borderRadius: "6px",
                        border: assignFilter === "unassigned" ? "1px solid #6C4AB6" : "1px solid #e5e7eb",
                        background: assignFilter === "unassigned" ? "rgba(108,74,182,0.08)" : "#fff",
                        color: assignFilter === "unassigned" ? "#6C4AB6" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      Needs Team ({abstracts.filter((a) => !a.teamId).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignFilter("all")}
                      style={{
                        padding: "0.25rem 0.55rem",
                        fontSize: "0.75rem",
                        fontWeight: assignFilter === "all" ? 700 : 500,
                        borderRadius: "6px",
                        border: assignFilter === "all" ? "1px solid #6C4AB6" : "1px solid #e5e7eb",
                        background: assignFilter === "all" ? "rgba(108,74,182,0.08)" : "#fff",
                        color: assignFilter === "all" ? "#6C4AB6" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      All ({abstracts.length})
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search by title, code..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    style={{
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      width: "170px",
                    }}
                  />
                </div>
              </div>

              {/* Abstracts List Box */}
              {(() => {
                const filteredList = abstracts.filter((a) => {
                  if (assignFilter === "unassigned" && a.teamId) return false;
                  if (!assignSearch.trim()) return true;
                  const query = assignSearch.toLowerCase();
                  return (
                    a.title?.toLowerCase().includes(query) ||
                    a.abstractId?.toLowerCase().includes(query) ||
                    a.category?.toLowerCase().includes(query) ||
                    (a.presentingAuthor && a.presentingAuthor.toLowerCase().includes(query))
                  );
                });

                return (
                  <div>
                    <div
                      style={{
                        maxHeight: "220px",
                        overflowY: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.65rem",
                        padding: "0.4rem",
                        background: "#fafafa",
                      }}
                    >
                      {filteredList.length === 0 ? (
                        <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>
                          No abstracts found matching the current search or filter.
                        </div>
                      ) : (
                        filteredList.map((a) => {
                          const isChecked = selectedAbstracts.includes(a.id);
                          return (
                            <div
                              key={a.id}
                              onClick={() => {
                                setSelectedAbstracts((prev) =>
                                  isChecked ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                                );
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.55rem 0.75rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                background: isChecked ? "rgba(108, 74, 182, 0.09)" : "#ffffff",
                                border: isChecked ? "1px solid #c4b5fd" : "1px solid transparent",
                                marginBottom: "0.25rem",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                style={{ cursor: "pointer" }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: "#111827",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {a.title}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6" }}>
                                    {a.abstractId || `GHC-ABS-${String(a.id).padStart(5, "0")}`}
                                  </span>
                                  <span>•</span>
                                  <span>{a.presentingAuthor || "Unknown Author"}</span>
                                  <span>•</span>
                                  <span>{a.category || "Poster"}</span>
                                  {a.teamName && (
                                    <>
                                      <span>•</span>
                                      <span style={{ color: "#059669", fontWeight: 600 }}>
                                        Current: {a.teamName}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Selection Buttons */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem", fontSize: "0.78rem" }}>
                      <span style={{ color: "#6b7280" }}>
                        Showing {filteredList.length} abstract(s)
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const ids = filteredList.map((a) => a.id);
                            setSelectedAbstracts((prev) => Array.from(new Set([...prev, ...ids])));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#6C4AB6",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            textDecoration: "underline",
                          }}
                        >
                          Select All Shown
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAbstracts([])}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.78rem",
                          }}
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 2: The Reviewer Teams (Click to assign) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", display: "block" }}>
                    2. Choose Reviewer Team (Click a Team to Assign)
                  </label>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {selectedAbstracts.length > 0
                      ? `Click any team below to assign the ${selectedAbstracts.length} selected abstract(s):`
                      : "Select at least one abstract above, then click a team below:"}
                  </span>
                </div>
              </div>

              {/* Teams Cards Grid */}
              {(() => {
                const teamList =
                  teams.length > 0
                    ? teams
                    : workflowRole?.allTeams?.length > 0
                    ? workflowRole.allTeams
                    : [];

                if (teamList.length === 0) {
                  return (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        border: "2px dashed #e5e7eb",
                        borderRadius: "0.85rem",
                        background: "#fafafa",
                      }}
                    >
                      <Users size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
                      <p style={{ margin: "0 0 0.5rem 0", fontWeight: 700, color: "#374151" }}>
                        No Reviewer Teams Found
                      </p>
                      <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#6b7280" }}>
                        Please create reviewer teams first under the <strong>Scientific Team</strong> tab.
                      </p>
                      <button
                        type="button"
                        className="admin-primary-button"
                        style={{ fontSize: "0.85rem" }}
                        onClick={() => {
                          setAssignModalOpen(false);
                          setActiveTab("team");
                          if (onNavigate) onNavigate("scientific-team");
                        }}
                      >
                        Create Teams in Scientific Team →
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "0.85rem",
                    }}
                  >
                    {teamList.map((team) => {
                      const leadMember = team.members?.find((m) => m.designation === "LEAD");
                      const leadName =
                        leadMember?.name || team.lead_name || team.leadName || "Not assigned yet";
                      const memberCount =
                        team.member_count !== undefined
                          ? Number(team.member_count)
                          : team.members?.length || 0;
                      const isAssigningThis = assigningTeamId === team.id;
                      const canClick = selectedAbstracts.length > 0 && assigningTeamId === null;

                      return (
                        <div
                          key={team.id}
                          onClick={() => {
                            if (canClick) {
                              handleAssignToTeam(team);
                            } else if (selectedAbstracts.length === 0) {
                              alert("Please select at least one abstract from Step 1 above before assigning.");
                            }
                          }}
                          style={{
                            border: "2px solid #e5e7eb",
                            borderRadius: "0.85rem",
                            padding: "1rem",
                            cursor: canClick ? "pointer" : selectedAbstracts.length === 0 ? "pointer" : "wait",
                            background: "#ffffff",
                            transition: "all 0.18s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            opacity: selectedAbstracts.length > 0 ? 1 : 0.75,
                          }}
                          onMouseEnter={(e) => {
                            if (canClick) {
                              e.currentTarget.style.borderColor = "#6C4AB6";
                              e.currentTarget.style.boxShadow = "0 8px 24px rgba(108, 74, 182, 0.15)";
                              e.currentTarget.style.transform = "translateY(-3px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.4rem",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "1.05rem",
                                  fontWeight: 800,
                                  color: "#111827",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                👥 {team.name}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "999px",
                                  background: "rgba(108,74,182,0.08)",
                                  color: "#6C4AB6",
                                }}
                              >
                                {memberCount} {memberCount === 1 ? "Reviewer" : "Reviewers"}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: "0.82rem",
                                color: "#4b5563",
                                marginBottom: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                              }}
                            >
                              <span style={{ fontWeight: 700, color: "#9333ea" }}>👑 Team Lead:</span>
                              <strong style={{ color: "#1f2937" }}>{leadName}</strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canClick && selectedAbstracts.length > 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canClick) {
                                handleAssignToTeam(team);
                              } else if (selectedAbstracts.length === 0) {
                                alert("Please select at least one abstract from Step 1 above before assigning.");
                              }
                            }}
                            className="admin-primary-button"
                            style={{
                              width: "100%",
                              justifyContent: "center",
                              padding: "0.55rem 0.85rem",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              marginTop: "0.5rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              background:
                                selectedAbstracts.length > 0
                                  ? "linear-gradient(135deg, #6C4AB6, #8b5cf6)"
                                  : "#9ca3af",
                              cursor: selectedAbstracts.length > 0 ? "pointer" : "default",
                            }}
                          >
                            {isAssigningThis ? (
                              <>
                                <RefreshCw size={14} className="spin" /> Assigning...
                              </>
                            ) : (
                              <>
                                Assign to {team.name} <ArrowRight size={14} />
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.75rem",
                paddingTop: "1rem",
                borderTop: "1px solid #f3f4f6",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                💡 Abstracts assigned to a team will immediately populate the Team Leader's "Assign Reviewers" queue.
              </span>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setAssignModalOpen(false)}
                disabled={assigningTeamId !== null}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abstract Inspection & Final Decision Modal */}
      {viewAbstract && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="admin-panel" style={{ width: "95%", maxWidth: "1150px", height: "92vh", maxHeight: "92vh", display: "flex", flexDirection: "column", margin: 0, padding: "1.5rem 2rem", borderRadius: "1.25rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", background: "#ffffff", overflow: "hidden" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.85rem", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6C4AB6", textTransform: "uppercase", background: "rgba(108,74,182,0.08)", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                    {viewAbstract.abstractId || `GHC-ABS-${String(viewAbstract.id).padStart(5, "0")}`}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize", padding: "0.2rem 0.6rem", borderRadius: "999px", background: viewAbstract.status === "accepted" ? "#dcfce7" : viewAbstract.status === "rejected" ? "#fee2e2" : "#fef3c7", color: viewAbstract.status === "accepted" ? "#15803d" : viewAbstract.status === "rejected" ? "#b91c1c" : "#b45309" }}>
                    {viewAbstract.status}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#111827", lineHeight: 1.3 }}>
                  {viewAbstract.title}
                </h2>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.3rem" }}>
                  <strong>Authors:</strong> {viewAbstract.authors || viewAbstract.presentingAuthor || "-"} • <strong>Institution:</strong> {viewAbstract.institution || "-"} • <strong>Category:</strong> {viewAbstract.category || "General"} • <strong>Track:</strong> {viewAbstract.track || "Scientific"}
                </div>
              </div>
              <button type="button" className="admin-icon-button" onClick={() => setViewAbstract(null)} style={{ padding: "0.4rem" }}>
                <X size={20} />
              </button>
            </div>

            {/* In-Website Abstract Viewer Body */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
              {(viewAbstract.pdfUrl || viewAbstract.fileUrl || viewAbstract.pdf_url) ? (
                <div style={{ flex: 1, minHeight: "420px", display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.85rem", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", fontSize: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, color: "#475467", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <FileText size={15} className="text-[#6C4AB6]" /> Embedded Abstract Document Viewer
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <a
                        href={apiUrl(viewAbstract.pdfUrl || viewAbstract.fileUrl || viewAbstract.pdf_url)}
                        download
                        style={{ fontSize: "0.75rem", color: "#374151", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none", background: "#ffffff", padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
                        title="Download Research Document to your device"
                      >
                        <Download size={13} /> Download Research File
                      </a>
                      <a
                        href={apiUrl(viewAbstract.pdfUrl || viewAbstract.fileUrl || viewAbstract.pdf_url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.75rem", color: "#6C4AB6", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                      >
                        Open in New Tab <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <iframe
                    src={apiUrl(viewAbstract.pdfUrl || viewAbstract.fileUrl || viewAbstract.pdf_url)}
                    style={{ width: "100%", height: "100%", flex: 1, border: "none" }}
                    title="Abstract Document Viewer"
                  />
                </div>
              ) : null}

              {viewAbstract.abstractText && (
                <div style={{ padding: "1rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", flexShrink: 0 }}>
                  <strong style={{ fontSize: "0.85rem", color: "#374151", display: "block", marginBottom: "0.4rem" }}>Abstract Text:</strong>
                  <div style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.6, maxHeight: (viewAbstract.pdfUrl || viewAbstract.fileUrl || viewAbstract.pdf_url) ? "140px" : "450px", overflowY: "auto", whiteSpace: "pre-line" }}>
                    {viewAbstract.abstractText}
                  </div>
                </div>
              )}

              {/* Workflow Stage & Lead Endorsement Highlight */}
              {viewAbstract.workflowStage === "lead_approved" && (
                <div style={{ padding: "1rem 1.25rem", background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "0.75rem", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#92400e" }}>
                      ⭐ Review Complete & Endorsed by Team Lead — Ready for Chairperson Final Verdict
                    </strong>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#6C4AB6", background: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                      Score: {viewAbstract.finalScore ?? "-"} / 50
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#78350f" }}>
                    <div>Reviewer Recommendation: <strong>{viewAbstract.reviewerRecommendedAction || "Accept"}</strong></div>
                    {viewAbstract.leadReviewNotes && (
                      <div style={{ marginTop: "0.25rem" }}>
                        Team Lead Endorsement Remarks: <em>"{viewAbstract.leadReviewNotes}"</em>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unassigned to Team Warning Banner */}
              {!viewAbstract.teamId && (
                <div style={{ padding: "0.75rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>
                    ⚠️ This abstract is currently unassigned to any Reviewer Team.
                  </span>
                  <button
                    type="button"
                    className="admin-primary-button"
                    style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                    onClick={() => {
                      const target = viewAbstract;
                      setViewAbstract(null);
                      openAssignModalForAbstract(target);
                    }}
                  >
                    Assign to Reviewer Team
                  </button>
                </div>
              )}
            </div>

            {/* Decision Controls Footer */}
            <div style={{ paddingTop: "0.85rem", marginTop: "0.75rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={decisionSubmitting}
                  onClick={() => handleUpdateStatus(viewAbstract.id, "accepted")}
                  style={{ padding: "0.55rem 1.15rem", borderRadius: "0.5rem", background: "#059669", color: "#ffffff", fontWeight: 700, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
                >
                  <CheckCircle2 size={16} /> Accept Abstract
                </button>

                <button
                  type="button"
                  disabled={decisionSubmitting}
                  onClick={() => {
                    const target = viewAbstract;
                    setViewAbstract(null);
                    handleOpenRevisionModal(target);
                  }}
                  style={{ padding: "0.55rem 1.15rem", borderRadius: "0.5rem", background: "#d97706", color: "#ffffff", fontWeight: 700, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
                  title="Request revision and send email to author"
                >
                  <Send size={15} /> Request Revision (Send Email)
                </button>

                <button
                  type="button"
                  disabled={decisionSubmitting}
                  onClick={() => handleUpdateStatus(viewAbstract.id, "rejected")}
                  style={{ padding: "0.55rem 1.15rem", borderRadius: "0.5rem", background: "#dc2626", color: "#ffffff", fontWeight: 700, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
                >
                  <X size={16} /> Reject Abstract
                </button>
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setViewAbstract(null)}
                style={{ fontSize: "0.85rem" }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Review Detail Modal */}
      {selectedReviewDetail && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="admin-panel" style={{ width: "95%", maxWidth: "840px", maxHeight: "90vh", overflowY: "auto", margin: 0, padding: "1.75rem", borderRadius: "1.25rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.08)", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                    {selectedReviewDetail.abstractCode || `GHC-ABS-${String(selectedReviewDetail.abstract_id).padStart(5, "0")}`}
                  </span>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "999px",
                    background: selectedReviewDetail.recommendation === "accept" ? "#dcfce7" : selectedReviewDetail.recommendation === "reject" ? "#fee2e2" : "#fef3c7",
                    color: selectedReviewDetail.recommendation === "accept" ? "#15803d" : selectedReviewDetail.recommendation === "reject" ? "#b91c1c" : "#b45309",
                  }}>
                    Recommendation: {selectedReviewDetail.recommendation}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#111827", lineHeight: 1.3 }}>
                  {selectedReviewDetail.title}
                </h3>
              </div>
              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setSelectedReviewDetail(null)}
                style={{ padding: "0.35rem" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Rejection Reasons Alert Card (Prominent if rejected) */}
            {selectedReviewDetail.recommendation === "reject" && (
              <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "0.75rem", padding: "1.1rem 1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#b91c1c", fontWeight: 800, fontSize: "0.95rem", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  <AlertCircle size={18} /> Stated Reasons for Rejection
                </div>
                <div style={{ fontSize: "0.9rem", color: "#7f1d1d", lineHeight: 1.6, whiteSpace: "pre-wrap", fontWeight: 500 }}>
                  {selectedReviewDetail.comments || "Reviewer concluded this submission did not satisfy conference quality and presentation criteria."}
                </div>
                {selectedReviewDetail.review_notes && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px dashed #fca5a5", fontSize: "0.85rem", color: "#991b1b" }}>
                    <strong>Chairperson / Committee Notes:</strong> {selectedReviewDetail.review_notes}
                  </div>
                )}
              </div>
            )}

            {/* Reviewer Meta Banner */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                  Reviewed by: {selectedReviewDetail.reviewer_name || "Assigned Reviewer"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {selectedReviewDetail.reviewer_email || "-"} • Specialization: {selectedReviewDetail.specialization || "General Medicine"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Date Submitted</span>
                <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>
                  {selectedReviewDetail.reviewed_at ? new Date(selectedReviewDetail.reviewed_at).toLocaleString() : "Recently"}
                </strong>
              </div>
            </div>

            {/* Score Breakdown (5 criteria) */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#111827" }}>
                  Scoring Breakdown
                </h4>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#6C4AB6", background: "rgba(108,74,182,0.08)", padding: "0.25rem 0.75rem", borderRadius: "0.5rem" }}>
                  Total: {selectedReviewDetail.total_score} / 50
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                {[
                  { label: "Scientific Merit", score: selectedReviewDetail.scientific_merit },
                  { label: "Originality", score: selectedReviewDetail.originality },
                  { label: "Methodology", score: selectedReviewDetail.methodology },
                  { label: "Clarity & Quality", score: selectedReviewDetail.presentation_quality },
                  { label: "Theme Relevance", score: selectedReviewDetail.relevance },
                ].map((crit) => {
                  const isLow = crit.score !== undefined && crit.score !== null && Number(crit.score) < 6;
                  return (
                    <div key={crit.label} style={{ background: isLow ? "#fef2f2" : "#ffffff", border: isLow ? "1px solid #fecaca" : "1px solid #e5e7eb", borderRadius: "0.6rem", padding: "0.65rem 0.75rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: isLow ? "#991b1b" : "#6b7280", fontWeight: 600, marginBottom: "0.2rem" }}>{crit.label}</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: isLow ? "#b91c1c" : "#111827" }}>
                        {crit.score !== undefined && crit.score !== null ? `${crit.score} / 10` : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviewer Comments & Qualitative Feedback */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#111827" }}>
                Reviewer Evaluation Feedback
              </h4>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1rem", fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {selectedReviewDetail.comments || "No textual comments provided by the reviewer."}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: "1rem", flexWrap: "wrap", gap: "0.6rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {/* View in Reader (No direct download) */}
                <button
                  type="button"
                  className="admin-primary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
                  onClick={() => {
                    handleOpenAbstractFromReview(selectedReviewDetail);
                  }}
                  title="View abstract document in the website reader"
                >
                  <Eye size={15} /> View in Reader
                </button>

                {/* Option to download research */}
                {(selectedReviewDetail.pdf_url || selectedReviewDetail.file_url) && (
                  <a
                    href={apiUrl(selectedReviewDetail.pdf_url || selectedReviewDetail.file_url)}
                    download
                    className="admin-secondary-button"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", textDecoration: "none", color: "#374151" }}
                    title="Download Research Document to device"
                  >
                    <Download size={15} /> Download Research
                  </a>
                )}

                {/* Action button for Revision which sends mail */}
                <button
                  type="button"
                  className="admin-secondary-button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.85rem",
                    color: "#d97706",
                    borderColor: "#fde68a",
                    background: "rgba(217,119,6,0.06)",
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    const target = selectedReviewDetail;
                    setSelectedReviewDetail(null);
                    handleOpenRevisionModal(target);
                  }}
                  title="Open revision request modal and send email to author"
                >
                  <Send size={14} /> Request Revision (Send Email)
                </button>
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedReviewDetail(null)}
                style={{ fontSize: "0.85rem" }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request & Email Modal */}
      {revisionModalTarget && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div className="admin-panel" style={{ width: "95%", maxWidth: "680px", margin: 0, padding: "1.75rem", borderRadius: "1.25rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", background: "#ffffff" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.85rem" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(217,119,6,0.1)", color: "#d97706", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  <Send size={12} /> Email Action • Author Revision Request
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#111827" }}>
                  Request Abstract Revision
                </h3>
              </div>
              <button
                type="button"
                className="admin-icon-button"
                disabled={revisionSending}
                onClick={() => setRevisionModalTarget(null)}
                style={{ padding: "0.35rem" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Abstract & Recipient Info */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "0.85rem 1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ color: "#64748b" }}>Abstract:</span>
                <span style={{ fontWeight: 700, color: "#6C4AB6" }}>{revisionModalTarget.code}</span>
              </div>
              <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                {revisionModalTarget.title}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.35rem", borderTop: "1px dashed #cbd5e1" }}>
                <span style={{ color: "#64748b" }}>Recipient Author:</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                  {revisionModalTarget.authorName} ({revisionModalTarget.email || "No email address found"})
                </span>
              </div>
            </div>

            <form onSubmit={handleSendRevisionEmail}>
              {/* Revision Instructions / Feedback Textarea */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.4rem" }}>
                  Revision Requirements & Reviewer Feedback to Include in Email:
                </label>
                <textarea
                  required
                  rows={5}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail the specific corrections required (e.g., clarify statistical methods, expand conclusion, reformat tables)..."
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.875rem", lineHeight: 1.5, boxSizing: "border-box" }}
                />
                <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.35rem", display: "block" }}>
                  Tip: This text will be embedded into the official email notification sent to the author with a secure 14-day revision submission link.
                </span>
              </div>

              {/* Automatic Email Details Alert */}
              <div style={{ background: "rgba(108,74,182,0.05)", border: "1px solid #e9d5ff", borderRadius: "0.6rem", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#581c87" }}>
                <strong>What happens next:</strong>
                <ul style={{ margin: "0.35rem 0 0 0", paddingLeft: "1.2rem", lineHeight: 1.4 }}>
                  <li>An automated email from GHC with these notes is sent to <strong>{revisionModalTarget.email || "author"}</strong>.</li>
                  <li>A secure 14-day revision link is generated allowing the author to upload their revised file without logging in.</li>
                  <li>The abstract status is updated to <strong>Revision Requested</strong>.</li>
                </ul>
              </div>

              {/* Result Alert Message */}
              {revisionFeedbackAlert && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: revisionFeedbackAlert.includes("successfully") ? "#ecfdf5" : "#fffbeb", color: revisionFeedbackAlert.includes("successfully") ? "#065f46" : "#b45309", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
                  {revisionFeedbackAlert}
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setRevisionModalTarget(null)}
                  disabled={revisionSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={revisionSending || !revisionNotes.trim()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#d97706", borderColor: "#d97706" }}
                >
                  <Send size={15} /> {revisionSending ? "Sending Email..." : "Send Revision Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}

export default Scientific;
