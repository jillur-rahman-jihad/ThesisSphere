import multer from "multer";
import path from "path";

// ============================================================
// MEMORY STORAGE
// PDF stays in memory and is then saved directly to MongoDB
// ============================================================

const storage = multer.memoryStorage();

// ============================================================
// PDF VALIDATION
// ============================================================

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const isPdfExtension =
    extension === ".pdf";

  const isPdfMimeType =
    file.mimetype === "application/pdf";

  if (
    isPdfExtension &&
    isPdfMimeType
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF files are allowed."
      ),
      false
    );
  }
};

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const uploadPaper = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum PDF size = 10 MB
    fileSize: 10 * 1024 * 1024,
  },
});

export default uploadPaper;