function isBlank(value) {
  return !String(value ?? "").trim();
}

export function validateComplaintForm({
  customerDetails,
  systemDetails,
  items,
  spares,
  charges,
}) {
  const errors = {};

  if (isBlank(customerDetails?.userName)) {
    errors["customerDetails.userName"] = "Customer name is required.";
  }

  if (!isBlank(customerDetails?.contactNo)) {
    const digits = String(customerDetails.contactNo).replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      errors["customerDetails.contactNo"] = "Enter a valid contact number.";
    }
  }

  if (isBlank(systemDetails?.systemSerialNo)) {
    errors["systemDetails.systemSerialNo"] = "System serial number is required.";
  }

  const hasAtLeastOneItem = (items || []).some((item) => !isBlank(item?.itemName));
  if (!hasAtLeastOneItem) {
    errors.items = "Add at least one item with item name.";
  }

  (items || []).forEach((item, index) => {
    const itemName = String(item?.itemName ?? "").trim();
    const remark = String(item?.remark ?? "").trim();

    if (!itemName && remark) {
      errors[`items.${index}.itemName`] = "Item name is required when remark is filled.";
    }
  });

  const chargesValue = Number(charges?.charges);
  if (!Number.isFinite(chargesValue) || chargesValue < 0) {
    errors["charges.charges"] = "Charges must be 0 or greater.";
  }

  const gstValue = Number(charges?.gst);
  if (!Number.isFinite(gstValue) || gstValue < 0 || gstValue > 100) {
    errors["charges.gst"] = "GST must be between 0 and 100.";
  }

  (spares || []).forEach((spare, index) => {
    const replaced = String(spare?.replaced ?? "").trim();
    const required = String(spare?.required ?? "").trim();
    const replacedQty = Number(spare?.replacedQty);
    const requiredQty = Number(spare?.requiredQty);

    if (replacedQty < 0 || !Number.isFinite(replacedQty)) {
      errors[`spares.${index}.replacedQty`] = "Quantity cannot be negative.";
    }

    if (requiredQty < 0 || !Number.isFinite(requiredQty)) {
      errors[`spares.${index}.requiredQty`] = "Quantity cannot be negative.";
    }

    if (replaced && replacedQty <= 0) {
      errors[`spares.${index}.replacedQty`] = "Set qty greater than 0 for replaced part.";
    }

    if (required && requiredQty <= 0) {
      errors[`spares.${index}.requiredQty`] = "Set qty greater than 0 for required part.";
    }
  });

  return errors;
}