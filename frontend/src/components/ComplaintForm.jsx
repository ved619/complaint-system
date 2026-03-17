import { useState } from "react";
import "./ComplaintForm.css";
import { validateComplaintForm } from "../utils/complaintValidation";
import { useToast } from "../context/ToastContext";

const emptyItem = () => ({ itemName: "", remark: "" });
const emptySpare = () => ({ replaced: "", replacedQty: 1, required: "", requiredQty: 1 });

function ComplaintForm({ apiFetch, complaintsApi, onSuccess, onClose }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [customerDetails, setCustomerDetails] = useState({
    unit: "", location: "", userName: "", contactNo: "",
  });
  const [systemDetails, setSystemDetails] = useState({ systemSerialNo: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [diagnosisAndComments, setDiagnosisAndComments] = useState("");
  const [spares, setSpares] = useState([emptySpare()]);
  const [charges, setCharges] = useState({
    warranty: false, amc: false, charges: 0, gst: 0, customerAcceptance: false,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const nextErrors = validateComplaintForm({
      customerDetails,
      systemDetails,
      items,
      spares,
      charges,
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error("Please fix highlighted fields before submitting.");
      setError("Please fix highlighted fields before submitting.");
      setSubmitting(false);
      return;
    }

    setFieldErrors({});

    try {
      const res = await apiFetch(complaintsApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerDetails,
          systemDetails,
          items: items.filter((i) => i.itemName.trim()),
          diagnosisAndComments,
          spares: spares
            .filter((s) => s.replaced.trim() || s.required.trim())
            .map((s) => ({
              ...s,
              replacedQty: Number(s.replacedQty) || 0,
              requiredQty: Number(s.requiredQty) || 0,
            })),
          charges: {
            ...charges,
            charges: Number(charges.charges) || 0,
            gst: Number(charges.gst) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create complaint");
      onSuccess();
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Item helpers ── */
  const setItem = (idx, field, val) => {
    clearFieldError(`items.${idx}.${field}`);
    clearFieldError("items");
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  /* ── Spare helpers ── */
  const setSpare = (idx, field, val) => {
    clearFieldError(`spares.${idx}.${field}`);
    setSpares((prev) => prev.map((sp, i) => (i === idx ? { ...sp, [field]: val } : sp)));
  };
  const addSpare = () => setSpares((prev) => [...prev, emptySpare()]);
  const removeSpare = (idx) => setSpares((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">Complaint System</p>
            <h2 className="modal-title">New Complaint</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <form onSubmit={handleSubmit} className="cform">
          {/* ── Customer Details ── */}
          <section className="cform-section">
            <h3 className="cform-section-title">Customer Details</h3>
            <div className="cform-grid-2">
              <label>
                Unit
                <input
                  value={customerDetails.unit}
                  placeholder="e.g. Unit-4"
                  onChange={(e) => setCustomerDetails((p) => ({ ...p, unit: e.target.value }))}
                />
              </label>
              <label>
                Location
                <input
                  value={customerDetails.location}
                  placeholder="e.g. Chennai"
                  onChange={(e) => setCustomerDetails((p) => ({ ...p, location: e.target.value }))}
                />
              </label>
              <label>
                Customer Name
                <input
                  className={getFieldError("customerDetails.userName") ? "input-invalid" : ""}
                  value={customerDetails.userName}
                  placeholder="Full name"
                  onChange={(e) => {
                    clearFieldError("customerDetails.userName");
                    setCustomerDetails((p) => ({ ...p, userName: e.target.value }));
                  }}
                />
                {getFieldError("customerDetails.userName") && (
                  <span className="field-error-text">{getFieldError("customerDetails.userName")}</span>
                )}
              </label>
              <label>
                Contact No.
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={getFieldError("customerDetails.contactNo") ? "input-invalid" : ""}
                  value={customerDetails.contactNo}
                  placeholder="10-digit number"
                  onChange={(e) => {
                    clearFieldError("customerDetails.contactNo");
                    const contactNo = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setCustomerDetails((p) => ({ ...p, contactNo }));
                  }}
                />
                {getFieldError("customerDetails.contactNo") && (
                  <span className="field-error-text">{getFieldError("customerDetails.contactNo")}</span>
                )}
              </label>
            </div>
          </section>

          {/* ── System Details ── */}
          <section className="cform-section">
            <h3 className="cform-section-title">System Details</h3>
            <label>
              System Serial No.
              <input
                className={getFieldError("systemDetails.systemSerialNo") ? "input-invalid" : ""}
                value={systemDetails.systemSerialNo}
                placeholder="e.g. SYS-20240001"
                onChange={(e) => {
                  clearFieldError("systemDetails.systemSerialNo");
                  setSystemDetails({ systemSerialNo: e.target.value });
                }}
              />
              {getFieldError("systemDetails.systemSerialNo") && (
                <span className="field-error-text">{getFieldError("systemDetails.systemSerialNo")}</span>
              )}
            </label>
          </section>

          {/* ── Items ── */}
          <section className="cform-section">
            <h3 className="cform-section-title">Items</h3>
            {items.map((item, idx) => (
              <div key={idx} className="cform-row-group">
                <div className="cform-grid-2">
                  <label>
                    Item Name
                    <input
                      className={getFieldError(`items.${idx}.itemName`) ? "input-invalid" : ""}
                      value={item.itemName}
                      placeholder="e.g. Power Supply"
                      onChange={(e) => setItem(idx, "itemName", e.target.value)}
                    />
                    {getFieldError(`items.${idx}.itemName`) && (
                      <span className="field-error-text">{getFieldError(`items.${idx}.itemName`)}</span>
                    )}
                  </label>
                  <label>
                    Remark
                    <input
                      value={item.remark}
                      placeholder="e.g. Not working"
                      onChange={(e) => setItem(idx, "remark", e.target.value)}
                    />
                  </label>
                </div>
                {items.length > 1 && (
                  <button type="button" className="row-remove-btn" onClick={() => removeItem(idx)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="row-add-btn" onClick={addItem}>
              + Add Item
            </button>
            {getFieldError("items") && (
              <p className="section-error-text">{getFieldError("items")}</p>
            )}
          </section>

          {/* ── Diagnosis & Comments ── */}
          <section className="cform-section">
            <h3 className="cform-section-title">Diagnosis &amp; Comments</h3>
            <label>
              Comments
              <textarea
                value={diagnosisAndComments}
                onChange={(e) => setDiagnosisAndComments(e.target.value)}
                placeholder="Describe the issue and diagnosis..."
                rows={3}
              />
            </label>
          </section>

          {/* ── Spares ── */}
          <section className="cform-section">
            <h3 className="cform-section-title">Spares</h3>
            {spares.map((spare, idx) => (
              <div key={idx} className="cform-row-group">
                <div className="cform-grid-4">
                  <label>
                    Replaced Part
                    <input
                      value={spare.replaced}
                      placeholder="Part name"
                      onChange={(e) => setSpare(idx, "replaced", e.target.value)}
                    />
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      min="0"
                      className={getFieldError(`spares.${idx}.replacedQty`) ? "input-invalid" : ""}
                      value={spare.replacedQty}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setSpare(idx, "replacedQty", nextValue === "" ? "" : Number(nextValue));
                      }}
                    />
                    {getFieldError(`spares.${idx}.replacedQty`) && (
                      <span className="field-error-text">{getFieldError(`spares.${idx}.replacedQty`)}</span>
                    )}
                  </label>
                  <label>
                    Required Part
                    <input
                      value={spare.required}
                      placeholder="Part name"
                      onChange={(e) => setSpare(idx, "required", e.target.value)}
                    />
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      min="0"
                      className={getFieldError(`spares.${idx}.requiredQty`) ? "input-invalid" : ""}
                      value={spare.requiredQty}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setSpare(idx, "requiredQty", nextValue === "" ? "" : Number(nextValue));
                      }}
                    />
                    {getFieldError(`spares.${idx}.requiredQty`) && (
                      <span className="field-error-text">{getFieldError(`spares.${idx}.requiredQty`)}</span>
                    )}
                  </label>
                </div>
                {spares.length > 1 && (
                  <button type="button" className="row-remove-btn" onClick={() => removeSpare(idx)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="row-add-btn" onClick={addSpare}>
              + Add Spare
            </button>
          </section>

          {/* ── Charges ── */}
          <section className="cform-section">
            <h3 className="cform-section-title">Charges</h3>
            <div className="cform-grid-2">
              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0"
                  className={getFieldError("charges.charges") ? "input-invalid" : ""}
                  value={charges.charges}
                  onChange={(e) => {
                    clearFieldError("charges.charges");
                    const nextValue = e.target.value;
                    setCharges((p) => ({ ...p, charges: nextValue === "" ? "" : Number(nextValue) }));
                  }}
                />
                {getFieldError("charges.charges") && (
                  <span className="field-error-text">{getFieldError("charges.charges")}</span>
                )}
              </label>
              <label>
                GST (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={getFieldError("charges.gst") ? "input-invalid" : ""}
                  value={charges.gst}
                  onChange={(e) => {
                    clearFieldError("charges.gst");
                    const nextValue = e.target.value;
                    setCharges((p) => ({ ...p, gst: nextValue === "" ? "" : Number(nextValue) }));
                  }}
                />
                {getFieldError("charges.gst") && (
                  <span className="field-error-text">{getFieldError("charges.gst")}</span>
                )}
              </label>
            </div>
            <div className="cform-checkbox-row">
              <label className="cform-checkbox">
                <input
                  type="checkbox"
                  checked={charges.warranty}
                  onChange={(e) => setCharges((p) => ({ ...p, warranty: e.target.checked }))}
                />
                Under Warranty
              </label>
              <label className="cform-checkbox">
                <input
                  type="checkbox"
                  checked={charges.amc}
                  onChange={(e) => setCharges((p) => ({ ...p, amc: e.target.checked }))}
                />
                AMC
              </label>
              <label className="cform-checkbox">
                <input
                  type="checkbox"
                  checked={charges.customerAcceptance}
                  onChange={(e) => setCharges((p) => ({ ...p, customerAcceptance: e.target.checked }))}
                />
                Customer Acceptance
              </label>
            </div>
          </section>

          {error && <p className="cform-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Creating..." : "Create Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComplaintForm;
