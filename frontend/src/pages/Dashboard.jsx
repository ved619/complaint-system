import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Dashboard.css";
import ComplaintForm from "../components/ComplaintForm";
import { STATUS_OPTIONS, getStatusLabel } from "../status";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";

const COMPLAINTS_API =
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth")
    .replace(/\/api\/auth$/, "/api/complaints");

function StatusBadge({ status }) {
  const classMap = { OPEN: "status-open", IN_PROGRESS: "status-inprog", RESOLVED: "status-resolved" };
  return (
    <span className={`status-badge ${classMap[status] ?? ""}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function buildStats(list) {
  return {
    total: list.length,
    open: list.filter((c) => c.status === "OPEN").length,
    inprog: list.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: list.filter((c) => c.status === "RESOLVED").length,
  };
}

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiFetch = useApi();
  const toast = useToast();
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState("overview");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [adminOverviewStats, setAdminOverviewStats] = useState(null);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(() => {
    const nextStatus = searchParams.get("status");
    if (!nextStatus) {
      return "ALL";
    }

    return nextStatus === "ALL" || STATUS_OPTIONS.includes(nextStatus)
      ? nextStatus
      : "ALL";
  });
  const [sortBy, setSortBy] = useState(() => {
    const nextSort = searchParams.get("sort");
    const allowedSorts = ["created_desc", "created_asc", "customer_asc", "status_asc"];
    return allowedSorts.includes(nextSort) ? nextSort : "created_desc";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const nextPage = Number(searchParams.get("page"));
    return Number.isInteger(nextPage) && nextPage > 0 ? nextPage : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const nextPageSize = Number(searchParams.get("pageSize"));
    const allowedPageSizes = [5, 10, 20, 50];
    return allowedPageSizes.includes(nextPageSize) ? nextPageSize : 10;
  });

  const userName = user?.name ?? "User";
  const userRole = user?.role ?? "ENGINEER";

  const fetchComplaints = useCallback(async (view) => {
    setLoading(true);
    setFetchError("");
    try {
      const url = view === "all" ? COMPLAINTS_API : `${COMPLAINTS_API}/my`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load complaints");
      setComplaints(data);
    } catch (err) {
      toast.error(err.message);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, toast]);

  useEffect(() => {
    fetchComplaints(activeNav === "all" ? "all" : "my");
  }, [activeNav, fetchComplaints]);

  useEffect(() => {
    if (userRole !== "ADMIN" || activeNav !== "overview") {
      return;
    }

    let isMounted = true;

    async function fetchAdminOverviewStats() {
      setAdminOverviewLoading(true);
      try {
        const response = await apiFetch(COMPLAINTS_API);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load complaint summary");
        }

        if (!isMounted) {
          return;
        }

        setAdminOverviewStats(buildStats(data));
      } catch (error) {
        if (isMounted) {
          toast.error(error.message);
        }
      } finally {
        if (isMounted) {
          setAdminOverviewLoading(false);
        }
      }
    }

    fetchAdminOverviewStats();

    return () => {
      isMounted = false;
    };
  }, [activeNav, apiFetch, toast, userRole]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`${COMPLAINTS_API}/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setComplaints((prev) => prev.filter((c) => c._id !== id));
      toast.success("Complaint deleted successfully.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    toast.success("Complaint created successfully.");
    fetchComplaints(activeNav === "all" ? "all" : "my");
  };

  const stats = useMemo(() => buildStats(complaints), [complaints]);
  const overviewStats = userRole === "ADMIN" && adminOverviewStats
    ? adminOverviewStats
    : stats;
  const overviewLoading = userRole === "ADMIN"
    ? loading || adminOverviewLoading
    : loading;

  
  const pageTitle =
    activeNav === "all" ? "All Complaints" : "My Complaints";

  const visibleComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = complaints.filter((complaint) => {
      if (statusFilter !== "ALL" && complaint.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchValues = [
        complaint._id,
        complaint.customerDetails?.userName,
        complaint.customerDetails?.unit,
        complaint.customerDetails?.location,
        complaint.systemDetails?.systemSerialNo,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchValues.some((value) => value.includes(query));
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === "created_asc") {
        return new Date(left.createdAt) - new Date(right.createdAt);
      }

      if (sortBy === "created_desc") {
        return new Date(right.createdAt) - new Date(left.createdAt);
      }

      if (sortBy === "customer_asc") {
        return (left.customerDetails?.userName || "").localeCompare(right.customerDetails?.userName || "");
      }

      if (sortBy === "status_asc") {
        return getStatusLabel(left.status).localeCompare(getStatusLabel(right.status));
      }

      return 0;
    });
  }, [complaints, searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy, activeNav]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (searchQuery.trim()) {
      nextParams.set("q", searchQuery.trim());
    }

    if (statusFilter !== "ALL") {
      nextParams.set("status", statusFilter);
    }

    if (sortBy !== "created_desc") {
      nextParams.set("sort", sortBy);
    }

    if (currentPage > 1) {
      nextParams.set("page", String(currentPage));
    }

    if (pageSize !== 10) {
      nextParams.set("pageSize", String(pageSize));
    }

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    searchQuery,
    statusFilter,
    sortBy,
    currentPage,
    pageSize,
    searchParams,
    setSearchParams,
  ]);

  const totalPages = Math.max(1, Math.ceil(visibleComplaints.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedComplaints = useMemo(() => {
    return visibleComplaints.slice(startIndex, endIndex);
  }, [visibleComplaints, startIndex, endIndex]);

  const pageStartDisplay = visibleComplaints.length === 0 ? 0 : startIndex + 1;
  const pageEndDisplay = Math.min(endIndex, visibleComplaints.length);

  return (
    <div className="dash-page">
      {/* ── Top nav ── */}
      <nav className="dash-nav">
        <div className="nav-brand">
          <span className="nav-eyebrow">Complaint System</span>
          <p className="nav-title">Service Portal</p>
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <span className="nav-user-name">{userName}</span>
            <span className={`nav-user-role role-${userRole.toLowerCase()}`}>
              {userRole}
            </span>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── New complaint modal ── */}
      {showForm && (
        <ComplaintForm
          apiFetch={apiFetch}
          complaintsApi={COMPLAINTS_API}
          onSuccess={handleFormSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ── Body ── */}
      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <span className="sidebar-label">Menu</span>
          <button
            className={`sidebar-item ${activeNav === "overview" ? "active" : ""}`}
            onClick={() => setActiveNav("overview")}
          >
            Overview
          </button>
          <button
            className={`sidebar-item ${activeNav === "complaints" ? "active" : ""}`}
            onClick={() => setActiveNav("complaints")}
          >
            My Complaints
          </button>
          {userRole === "ADMIN" && (
            <>
              <span className="sidebar-label">Admin</span>
              <button
                className={`sidebar-item ${activeNav === "all" ? "active" : ""}`}
                onClick={() => setActiveNav("all")}
              >
                All Complaints
              </button>
            </>
          )}
        </aside>

        {/* Content */}
        <main className="dash-content">
          {/* Welcome + stats shown on overview */}
          {activeNav === "overview" && (
            <>
              <div className="dash-welcome">
                <h2>Welcome back, {userName}</h2>
                <p>
                  {userRole === "ADMIN"
                    ? "Here's a summary of all complaints across the system."
                    : "Here's a summary of your service complaints."}
                </p>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <p className="stat-label">Total</p>
                  <p className="stat-value">{overviewLoading ? "…" : overviewStats.total}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Open</p>
                  <p className="stat-value open">{overviewLoading ? "…" : overviewStats.open}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">In Progress</p>
                  <p className="stat-value inprog">{overviewLoading ? "…" : overviewStats.inprog}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Closed</p>
                  <p className="stat-value resolved">{overviewLoading ? "…" : overviewStats.resolved}</p>
                </div>
              </div>
            </>
          )}

          {/* Complaint list panel */}
          <div key={activeNav} className="dash-panel">
            <div className="dash-panel-header">
              <h3>{pageTitle}</h3>
              <button className="new-complaint-btn" onClick={() => setShowForm(true)}>
                + New Complaint
              </button>
            </div>

            {!loading && !fetchError && complaints.length > 0 && (
              <>
                <div className="dash-toolbar">
                  <label>
                    Search
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="ID, customer, unit, serial..."
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="ALL">All</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Sort
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="created_desc">Newest First</option>
                      <option value="created_asc">Oldest First</option>
                      <option value="customer_asc">Customer Name (A-Z)</option>
                      <option value="status_asc">Status (A-Z)</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                      setSortBy("created_desc");
                    }}
                  >
                    Reset
                  </button>
                </div>

                <p className="results-count">
                  Showing {pageStartDisplay}-{pageEndDisplay} of {visibleComplaints.length}
                  {visibleComplaints.length !== complaints.length
                    ? ` (filtered from ${complaints.length})`
                    : ""}
                </p>
              </>
            )}

            {loading && (
              <div className="dash-loading">
                <span className="loading-spinner" /> Loading...
              </div>
            )}

            {!loading && fetchError && (
              <p className="feedback err">{fetchError}</p>
            )}

            {!loading && !fetchError && complaints.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No complaints yet. Create one to get started.</p>
              </div>
            )}

            {!loading && !fetchError && complaints.length > 0 && visibleComplaints.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔎</div>
                <p>No complaints match your search/filter.</p>
              </div>
            )}

            {!loading && !fetchError && visibleComplaints.length > 0 && (
              <div className="complaint-list">
                <table className="complaint-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Unit</th>
                      <th>Serial No.</th>
                      <th>Status</th>
                      <th>Created</th>
                      {userRole === "ADMIN" && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedComplaints.map((c) => (
                      <tr
                        key={c._id}
                        className="complaint-row"
                        onClick={() => navigate(`/complaints/${c._id}`)}
                      >
                        <td className="td-id">#{c._id.slice(-6).toUpperCase()}</td>
                        <td>{c.customerDetails?.userName || "—"}</td>
                        <td>{c.customerDetails?.unit || "—"}</td>
                        <td className="td-mono">{c.systemDetails?.systemSerialNo || "—"}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="td-date">{formatDate(c.createdAt)}</td>
                        {userRole === "ADMIN" && (
                          <td>
                            <button
                              className="delete-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(c._id);
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !fetchError && visibleComplaints.length > 0 && (
              <div className="pagination-row">
                <label className="page-size-select">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <div className="page-controls">
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={safePage === 1}
                  >
                    First
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                    disabled={safePage === 1}
                  >
                    Prev
                  </button>
                  <span className="page-indicator">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                    disabled={safePage === totalPages}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safePage === totalPages}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
