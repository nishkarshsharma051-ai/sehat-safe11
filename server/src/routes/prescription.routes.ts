import { Router } from "express";
import multer from "multer";
import { analyzePrescription } from "../controllers/prescriptionController";
import { protect } from "../utils/authMiddleware";

const router = Router();

// Memory storage with file size limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only image and PDF files allowed"));
        }
    },
});

router.post(
    "/process-prescription",
    protect,
    upload.single("image"),
    analyzePrescription
);

// New Routes for Doctor Dashboard & History
import { createPrescription, getPrescriptions, deletePrescription } from "../controllers/prescriptionController";

router.post("/", protect, createPrescription);
router.get("/", protect, getPrescriptions);
router.delete("/:id", protect, deletePrescription);

export default router;
