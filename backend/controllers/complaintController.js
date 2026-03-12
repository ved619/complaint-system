import Complaint from "../models/Complaint.js";

export const createComplaint = async (req, res) => {
  const { customerDetails, systemDetails, items, diagnosisAndComments, spares, charges } = req.body;

  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const complaint = await Complaint.create({
      createdBy: userId,
      customerDetails,
      systemDetails,
      items,
      diagnosisAndComments,
      spares,
      charges,
    });

    res.status(201).json({
      message: "Complaint created successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("createdBy", "name email");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user?.role !== "ADMIN" && complaint.createdBy?._id?.toString() !== req.user?.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate("createdBy", "name email");
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const complaints = await Complaint.find({ createdBy: userId }).populate("createdBy", "name email");
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user?.role !== "ADMIN" && complaint.createdBy?.toString() !== req.user?.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const allowedFields = [
      "customerDetails",
      "systemDetails",
      "items",
      "diagnosisAndComments",
      "spares",
      "charges",
      "status",
    ];

    const incomingFields = Object.keys(req.body);
    const invalidFields = incomingFields.filter((field) => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: `Invalid update fields: ${invalidFields.join(", ")}`,
      });
    }

    if (req.body.status !== undefined) {
      const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];

      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          message: `Invalid status value: ${req.body.status}`,
        });
      }
    }

    for (const field of incomingFields) {
      complaint[field] = req.body[field];
    }

    await complaint.save();

    res.json({
      message: "Complaint updated successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user?.role !== "ADMIN" && complaint.createdBy?.toString() !== req.user?.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await complaint.deleteOne();

    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
