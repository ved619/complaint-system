import express from "express";
import {
  createComplaint,
  deleteComplaint,
  getAllComplaints,
  getComplaint,
  getMyComplaints,
  updateComplaint,
} from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", authorizeRoles("ENGINEER", "ADMIN"), createComplaint);
router.get("/", authorizeRoles("ADMIN"), getAllComplaints);
router.get("/my", authorizeRoles("ENGINEER", "ADMIN"), getMyComplaints);
router.get("/:id", authorizeRoles("ENGINEER", "ADMIN"), getComplaint);
router.put("/:id", authorizeRoles("ENGINEER", "ADMIN"), updateComplaint);
router.delete("/:id", authorizeRoles("ADMIN"), deleteComplaint);

export default router;
