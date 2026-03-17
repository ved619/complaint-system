import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ComplaintDetail.css";
import { getAvailableStatuses, getStatusLabel } from "../status";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { validateComplaintForm } from "../utils/complaintValidation";
import { useToast } from "../context/ToastContext";

const COMPLAINTS_API =
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth")
    .replace(/\/api\/auth$/, "/api/complaints");

const emptyItem = () => ({ itemName: "", remark: "" });
const emptySpare = () => ({ replaced: "", replacedQty: 1, required: "", requiredQty: 1 });

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiFetch = useApi();
  const toast = useToast();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [complaint, setComplaint] = useState(null);

  const [customerDetails, setCustomerDetails] = useState({
    unit: "",
    location: "",
    userName: "",
    contactNo: "",
  });
  const [systemDetails, setSystemDetails] = useState({ systemSerialNo: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [diagnosisAndComments, setDiagnosisAndComments] = useState("");
  const [spares, setSpares] = useState([emptySpare()]);
  const [charges, setCharges] = useState({
    warranty: false,
    amc: false,
    charges: 0,
    gst: 0,
    customerAcceptance: false,
  });
  const [status, setStatus] = useState("OPEN");

  useEffect(() => {
    let isMounted = true;

    async function fetchComplaint() {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch(`${COMPLAINTS_API}/${id}`);

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load complaint");
        }

        if (!isMounted) {
          return;
        }

        setComplaint(data);
        setCustomerDetails(data.customerDetails || {
          unit: "",
          location: "",
          userName: "",
          contactNo: "",
        });
        setSystemDetails(data.systemDetails || { systemSerialNo: "" });
        setItems(data.items?.length ? data.items : [emptyItem()]);
        setDiagnosisAndComments(data.diagnosisAndComments || "");
        setSpares(data.spares?.length ? data.spares : [emptySpare()]);
        setCharges({
          warranty: Boolean(data.charges?.warranty),
          amc: Boolean(data.charges?.amc),
          charges: data.charges?.charges ?? 0,
          gst: data.charges?.gst ?? 0,
          customerAcceptance: Boolean(data.charges?.customerAcceptance),
        });
        setStatus(data.status || "OPEN");
      } catch (loadError) {
        if (isMounted) {
          toast.error(loadError.message);
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchComplaint();

    return () => {
      isMounted = false;
    };
  }, [id, apiFetch, toast]);

  const statusOptions = useMemo(() => getAvailableStatuses(), []);

  const getFieldError = (fieldKey) => fieldErrors[fieldKey];
  const clearFieldError = (fieldKey) => {
    setFieldErrors((previous) => {
      if (!previous[fieldKey]) {
        return previous;
      }

      const next = { ...previous };
      delete next[fieldKey];
      return next;
    });
  };

  const updateItem = (index, field, value) => {
    clearFieldError(`items.${index}.${field}`);
    clearFieldError("items");
    setItems((previous) =>
      previous.map((entry, itemIndex) =>
        itemIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const updateSpare = (index, field, value) => {
    clearFieldError(`spares.${index}.${field}`);
    setSpares((previous) =>
      previous.map((entry, spareIndex) =>
        spareIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const onSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const nextErrors = validateComplaintForm({
      customerDetails,
      systemDetails,
      items,
      spares,
      charges,
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Please fix highlighted fields before saving.");
      return;
    }

    setFieldErrors({});
    setSaving(true);

    const payload = {
      customerDetails,
      systemDetails,
      items: items.filter((item) => item.itemName?.trim()),
      diagnosisAndComments,
      spares: spares.filter((spare) => spare.replaced?.trim() || spare.required?.trim()),
      charges: {
        warranty: Boolean(charges.warranty),
        amc: Boolean(charges.amc),
        charges: Number(charges.charges) || 0,
        gst: Number(charges.gst) || 0,
        customerAcceptance: Boolean(charges.customerAcceptance),
      },
      status,
    };

    try {
      const response = await apiFetch(`${COMPLAINTS_API}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update complaint");
      }

      setComplaint(data.complaint);
      toast.success("Complaint updated successfully.");
      setMessage("Complaint updated successfully.");
    } catch (saveError) {
      toast.error(saveError.message);
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="detail-page">
        <div className="detail-shell">
          <p className="detail-loading">Loading complaint...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <section className="detail-shell">
        <header className="detail-header">
          <div>
            <p className="eyebrow">Complaint Detail</p>
            <h1>#{complaint?._id?.slice(-8).toUpperCase()}</h1>
            <p className="detail-meta">
              Created {complaint?.createdAt ? formatDate(complaint.createdAt) : "-"}
              {complaint?.createdBy?.name ? ` by ${complaint.createdBy.name}` : ""}
            </p>
          </div>
          <div className="detail-actions">
            <button className="light-btn" type="button" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
            <button
              className="logout-btn"
              type="button"
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <form className="detail-form" onSubmit={onSave}>
          <section className="detail-card">
            <h2>Customer Details</h2>
            <div className="grid-2">
              <label>
                Unit
                <input
                  value={customerDetails.unit || ""}
                  onChange={(event) =>
                    setCustomerDetails((previous) => ({ ...previous, unit: event.target.value }))
                  }
                />
              </label>
              <label>
                Location
                <input
                  value={customerDetails.location || ""}
                  onChange={(event) =>
                    setCustomerDetails((previous) => ({ ...previous, location: event.target.value }))
                  }
                />
              </label>
              <label>
                Customer Name
                <input
                  className={getFieldError("customerDetails.userName") ? "input-invalid" : ""}
                  value={customerDetails.userName || ""}
                  onChange={(event) => {
                    clearFieldError("customerDetails.userName");
                    setCustomerDetails((previous) => ({ ...previous, userName: event.target.value }));
                  }}
                />
                {getFieldError("customerDetails.userName") && (
                  <span className="field-error-text">{getFieldError("customerDetails.userName")}</span>
                )}
              </label>
              <label>
                Contact No.
                <input
                  className={getFieldError("customerDetails.contactNo") ? "input-invalid" : ""}
                  value={customerDetails.contactNo || ""}
                  onChange={(event) => {
                    clearFieldError("customerDetails.contactNo");
                    setCustomerDetails((previous) => ({ ...previous, contactNo: event.target.value }));
                  }}
                />
                {getFieldError("customerDetails.contactNo") && (
                  <span className="field-error-text">{getFieldError("customerDetails.contactNo")}</span>
                )}
              </label>
            </div>
          </section>

          <section className="detail-card">
            <h2>System & Status</h2>
            <div className="grid-2">
              <label>
                System Serial No.
                <input
                  className={getFieldError("systemDetails.systemSerialNo") ? "input-invalid" : ""}
                  value={systemDetails.systemSerialNo || ""}
                  onChange={(event) => {
                    clearFieldError("systemDetails.systemSerialNo");
                    setSystemDetails({ systemSerialNo: event.target.value });
                  }}
                />
                {getFieldError("systemDetails.systemSerialNo") && (
                  <span className="field-error-text">{getFieldError("systemDetails.systemSerialNo")}</span>
                )}
              </label>
              <label>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {getStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="detail-card">
            <h2>Items</h2>
            {items.map((item, index) => (
              <div className="row-group" key={`item-${index}`}>
                <div className="grid-2">
                  <label>
                    Item Name
                    <input
                      className={getFieldError(`items.${index}.itemName`) ? "input-invalid" : ""}
                      value={item.itemName || ""}
                      onChange={(event) => updateItem(index, "itemName", event.target.value)}
                    />
                    {getFieldError(`items.${index}.itemName`) && (
                      <span className="field-error-text">{getFieldError(`items.${index}.itemName`)}</span>
                    )}
                  </label>
                  <label>
                    Remark
                    <input
                      value={item.remark || ""}
                      onChange={(event) => updateItem(index, "remark", event.target.value)}
                    />
                  </label>
                </div>
                {items.length > 1 && (
                  <button
                    className="row-remove-btn"
                    type="button"
                    onClick={() => setItems((previous) => previous.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              className="row-add-btn"
              type="button"
              onClick={() => setItems((previous) => [...previous, emptyItem()])}
            >
              + Add Item
            </button>
            {getFieldError("items") && (
              <p className="section-error-text">{getFieldError("items")}</p>
            )}
          </section>

          <section className="detail-card">
            <h2>Diagnosis & Comments</h2>
            <label>
              Comments
              <textarea
                rows={4}
                value={diagnosisAndComments || ""}
                onChange={(event) => setDiagnosisAndComments(event.target.value)}
              />
            </label>
          </section>

          <section className="detail-card">
            <h2>Spares</h2>
            {spares.map((spare, index) => (
              <div className="row-group" key={`spare-${index}`}>
                <div className="grid-4">
                  <label>
                    Replaced
                    <input
                      value={spare.replaced || ""}
                      onChange={(event) => updateSpare(index, "replaced", event.target.value)}
                    />
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      min="0"
                      className={getFieldError(`spares.${index}.replacedQty`) ? "input-invalid" : ""}
                      value={spare.replacedQty ?? 0}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        updateSpare(index, "replacedQty", nextValue === "" ? "" : Number(nextValue));
                      }}
                    />
                    {getFieldError(`spares.${index}.replacedQty`) && (
                      <span className="field-error-text">{getFieldError(`spares.${index}.replacedQty`)}</span>
                    )}
                  </label>
                  <label>
                    Required
                    <input
                      value={spare.required || ""}
                      onChange={(event) => updateSpare(index, "required", event.target.value)}
                    />
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      min="0"
                      className={getFieldError(`spares.${index}.requiredQty`) ? "input-invalid" : ""}
                      value={spare.requiredQty ?? 0}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        updateSpare(index, "requiredQty", nextValue === "" ? "" : Number(nextValue));
                      }}
                    />
                    {getFieldError(`spares.${index}.requiredQty`) && (
                      <span className="field-error-text">{getFieldError(`spares.${index}.requiredQty`)}</span>
                    )}
                  </label>
                </div>
                {spares.length > 1 && (
                  <button
                    className="row-remove-btn"
                    type="button"
                    onClick={() => setSpares((previous) => previous.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              className="row-add-btn"
              type="button"
              onClick={() => setSpares((previous) => [...previous, emptySpare()])}
            >
              + Add Spare
            </button>
          </section>

          <section className="detail-card">
            <h2>Charges</h2>
            <div className="grid-2">
              <label>
                Charges
                <input
                  type="number"
                  min="0"
                  className={getFieldError("charges.charges") ? "input-invalid" : ""}
                  value={charges.charges ?? ""}
                  onChange={(event) => {
                    clearFieldError("charges.charges");
                    const nextValue = event.target.value;
                    setCharges((previous) => ({
                      ...previous,
                      charges: nextValue === "" ? "" : Number(nextValue),
                    }));
                  }}
                />
                {getFieldError("charges.charges") && (
                  <span className="field-error-text">{getFieldError("charges.charges")}</span>
                )}
              </label>
              <label>
                GST
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={getFieldError("charges.gst") ? "input-invalid" : ""}
                  value={charges.gst ?? ""}
                  onChange={(event) => {
                    clearFieldError("charges.gst");
                    const nextValue = event.target.value;
                    setCharges((previous) => ({
                      ...previous,
                      gst: nextValue === "" ? "" : Number(nextValue),
                    }));
                  }}
                />
                {getFieldError("charges.gst") && (
                  <span className="field-error-text">{getFieldError("charges.gst")}</span>
                )}
              </label>
            </div>
            <div className="check-row">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={Boolean(charges.warranty)}
                  onChange={(event) =>
                    setCharges((previous) => ({ ...previous, warranty: event.target.checked }))
                  }
                />
                Warranty
              </label>
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={Boolean(charges.amc)}
                  onChange={(event) =>
                    setCharges((previous) => ({ ...previous, amc: event.target.checked }))
                  }
                />
                AMC
              </label>
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={Boolean(charges.customerAcceptance)}
                  onChange={(event) =>
                    setCharges((previous) => ({ ...previous, customerAcceptance: event.target.checked }))
                  }
                />
                Customer Acceptance
              </label>
            </div>
          </section>

          {error && <p className="feedback err">{error}</p>}
          {message && <p className="feedback ok">{message}</p>}

          <div className="detail-footer">
            <button className="submit-btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ComplaintDetail;
