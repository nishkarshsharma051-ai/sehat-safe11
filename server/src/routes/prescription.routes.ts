import { Router } from "express";
import multer from "multer";
import { analyzePrescription } from "../controllers/prescriptionController";

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
    upload.single("image"),
    analyzePrescription
);

// New Routes for Doctor Dashboard & History
import { createPrescription, getPrescriptions } from "../controllers/prescriptionController";

router.post("/", createPrescription);
router.get("/", getPrescriptions);

export default router;
