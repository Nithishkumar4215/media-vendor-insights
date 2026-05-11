import express from "express";
import mysql from "mysql2";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import multer from "multer";
import * as xlsx from "xlsx";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   ✅ MIDDLEWARE
========================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   ✅ MULTER - FILE UPLOAD
========================= */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    const allowedExt = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls) and CSV files are allowed"));
    }
  },
});

/* =========================
   ✅ DATABASE CONNECTION
========================= */
const db = mysql.createConnection({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME     || "vendor_db",
  charset:  "utf8mb4",
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB CONNECTION ERROR:", err.message);
    process.exit(1);
  }
  console.log("✅ DB CONNECTED");
  initializeDatabase();
});

// Keep connection alive
setInterval(() => {
  db.ping((err) => {
    if (err) console.error("❌ DB PING ERROR:", err.message);
  });
}, 60000);

/* =========================
   ✅ DATABASE INIT
========================= */
function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS file_uploads (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      vendor      VARCHAR(255)  NOT NULL,
      file_name   VARCHAR(255)  NOT NULL,
      data_count  INT           NOT NULL DEFAULT 0,
      status      VARCHAR(50)   NOT NULL DEFAULT 'Correct',
      file_path   VARCHAR(500)  NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vendor (vendor),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ TABLE CREATION ERROR:", err.message);
      return;
    }
    console.log("✅ TABLE READY");

    const alterQueries = [
      "ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) NULL",
      "ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ];

    alterQueries.forEach((q) => {
      db.query(q, () => {});
    });
  });
}

/* =========================
   ✅ UPLOADS DIRECTORY
========================= */
const UPLOADS_DIR = path.join(process.cwd(), "backend", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("✅ UPLOADS DIR CREATED:", UPLOADS_DIR);
}

// Serve uploads as static files for download
app.use("/api/downloads", express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
  },
}));

/* =========================
   ✅ HELPER: DB QUERY (Promise)
========================= */
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

/* =========================
   ✅ HELPER: PARSE EXCEL/CSV
========================= */
function parseFileBuffer(buffer, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  let workbook;
  if (ext === ".csv") {
    const csvText = buffer.toString("utf8");
    workbook = xlsx.read(csvText, { type: "string" });
  } else {
    workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

  return { workbook, jsonData, sheetName: firstSheetName };
}

/* =========================
   ✅ HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  db.ping((err) => {
    if (err) {
      return res.status(503).json({ status: "error", db: "disconnected", message: err.message });
    }
    res.json({ status: "ok", db: "connected", uptime: process.uptime(), timestamp: new Date().toISOString() });
  });
});

/* =========================
   ✅ GET ALL FILES
========================= */
app.get("/api/files", async (req, res) => {
  try {
    const { vendor, status, limit = 1000, offset = 0 } = req.query;

    let query = "SELECT * FROM file_uploads WHERE 1=1";
    const params = [];

    if (vendor) {
      query += " AND vendor = ?";
      params.push(vendor);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const results = await dbQuery(query, params);
    console.log(`📤 SENDING ${results.length} RECORDS`);
    res.json(results);
  } catch (err) {
    console.error("❌ FETCH ERROR:", err.message);
    res.status(500).json({ error: "Database fetch failed", details: err.message });
  }
});

/* =========================
   ✅ GET SINGLE FILE
========================= */
app.get("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const results = await dbQuery("SELECT * FROM file_uploads WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error("❌ FETCH SINGLE ERROR:", err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

/* =========================
   ✅ PREVIEW FILE DATA
========================= */
app.get("/api/files/:id/data", async (req, res) => {
  try {
    const { id } = req.params;
    const results = await dbQuery("SELECT * FROM file_uploads WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const record = results[0];

    if (record.file_path) {
      const filename = record.file_path.split("/").pop();
      const physicalPath = path.join(UPLOADS_DIR, filename);

      if (fs.existsSync(physicalPath)) {
        try {
          const buffer = fs.readFileSync(physicalPath);
          const { jsonData } = parseFileBuffer(buffer, record.file_name);
          return res.json({ metadata: record, data: jsonData, rowCount: jsonData.length });
        } catch (parseErr) {
          console.error("❌ FILE PARSE ERROR:", parseErr.message);
        }
      }
    }

    return res.json({
      metadata: record,
      data: [{
        "ID":          record.id,
        "Record Name": record.file_name,
        "Date":        new Date(record.created_at).toISOString().split("T")[0],
        "Count":       record.data_count,
        "Status":      record.status,
        "Note":        "Manual ledger entry — no raw datasheet attached.",
      }],
      rowCount: 1,
    });
  } catch (err) {
    console.error("❌ PREVIEW ERROR:", err.message);
    res.status(500).json({ error: "Failed to load preview", details: err.message });
  }
});

/* =========================
   ✅ MANUAL UPLOAD
========================= */
app.post("/api/upload", async (req, res) => {
  try {
    const { vendor, fileName, dataCount, status } = req.body;

    console.log("📥 MANUAL UPLOAD:", req.body);

    if (!vendor?.trim() || !fileName?.trim() || dataCount === undefined || !status) {
      return res.status(400).json({ error: "Missing required fields: vendor, fileName, dataCount, status" });
    }

    if (!["Correct", "Wrong"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Correct' or 'Wrong'" });
    }

    const result = await dbQuery(
      "INSERT INTO file_uploads (vendor, file_name, data_count, status) VALUES (?, ?, ?, ?)",
      [vendor.trim(), fileName.trim(), parseInt(dataCount) || 0, status]
    );

    console.log("✅ MANUAL INSERT ID:", result.insertId);
    res.status(201).json({ message: "File uploaded successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ MANUAL UPLOAD ERROR:", err.message);
    res.status(500).json({ error: "Database insertion failed", details: err.message });
  }
});

/* =========================
   ✅ EXCEL / CSV UPLOAD
========================= */
app.post("/api/upload-excel", upload.single("file"), async (req, res) => {
  try {
    const { vendor } = req.body;
    const file = req.file;

    console.log("📥 EXCEL UPLOAD:", { vendor, fileName: file?.originalname, size: file?.size });

    if (!vendor?.trim()) {
      return res.status(400).json({ error: "Vendor name is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { jsonData } = parseFileBuffer(file.buffer, file.originalname);
    const dataCount = jsonData.length;

    const uniqueFileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const physicalPath = path.join(UPLOADS_DIR, uniqueFileName);
    fs.writeFileSync(physicalPath, file.buffer);

    const relativePath = `/api/downloads/${uniqueFileName}`;

    const result = await dbQuery(
      "INSERT INTO file_uploads (vendor, file_name, data_count, status, file_path) VALUES (?, ?, ?, ?, ?)",
      [vendor.trim(), file.originalname, dataCount, "Correct", relativePath]
    );

    console.log("✅ EXCEL INSERT ID:", result.insertId, "ROWS:", dataCount);
    res.status(201).json({
      message:   "Excel file processed and saved",
      id:        result.insertId,
      dataCount,
      fileUrl:   relativePath,
    });
  } catch (err) {
    console.error("❌ EXCEL UPLOAD ERROR:", err.message);
    res.status(500).json({ error: err.message || "Failed to process Excel file" });
  }
});

/* =========================
   ✅ UPDATE RECORD STATUS
========================= */
app.put("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vendor, fileName, dataCount } = req.body;

    const fields = [];
    const params = [];

    if (status) {
      if (!["Correct", "Wrong"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'Correct' or 'Wrong'" });
      }
      fields.push("status = ?");
      params.push(status);
    }
    if (vendor)    { fields.push("vendor = ?");     params.push(vendor.trim()); }
    if (fileName)  { fields.push("file_name = ?");  params.push(fileName.trim()); }
    if (dataCount !== undefined) { fields.push("data_count = ?"); params.push(parseInt(dataCount) || 0); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);
    const result = await dbQuery(`UPDATE file_uploads SET ${fields.join(", ")} WHERE id = ?`, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    console.log("✅ UPDATED RECORD:", id);
    res.json({ message: "Record updated successfully" });
  } catch (err) {
    console.error("❌ UPDATE ERROR:", err.message);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
});

/* =========================
   ✅ DELETE FILE
========================= */
app.delete("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const results = await dbQuery("SELECT * FROM file_uploads WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const record = results[0];

    if (record.file_path) {
      const filename = record.file_path.split("/").pop();
      const physicalPath = path.join(UPLOADS_DIR, filename);

      try {
        if (fs.existsSync(physicalPath)) {
          fs.unlinkSync(physicalPath);
          console.log("✅ PHYSICAL FILE DELETED:", physicalPath);
        }
      } catch (fileErr) {
        console.error("⚠️ PHYSICAL FILE DELETE WARN:", fileErr.message);
      }
    }

    await dbQuery("DELETE FROM file_uploads WHERE id = ?", [id]);
    console.log("✅ DB RECORD DELETED:", id);

    res.json({ message: "Record deleted successfully", id: parseInt(id) });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err.message);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

/* =========================
   ✅ BULK DELETE
========================= */
app.delete("/api/files", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Provide an array of IDs to delete" });
    }

    const placeholders = ids.map(() => "?").join(",");
    const records = await dbQuery(`SELECT id, file_path FROM file_uploads WHERE id IN (${placeholders})`, ids);

    records.forEach((record) => {
      if (record.file_path) {
        const filename = record.file_path.split("/").pop();
        const physicalPath = path.join(UPLOADS_DIR, filename);
        try {
          if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);
        } catch (e) {}
      }
    });

    const result = await dbQuery(`DELETE FROM file_uploads WHERE id IN (${placeholders})`, ids);
    console.log("✅ BULK DELETE:", result.affectedRows, "records");

    res.json({ message: `${result.affectedRows} records deleted`, deleted: result.affectedRows });
  } catch (err) {
    console.error("❌ BULK DELETE ERROR:", err.message);
    res.status(500).json({ error: "Bulk delete failed", details: err.message });
  }
});

/* =========================
   ✅ STATS / ANALYTICS
========================= */
app.get("/api/stats", async (req, res) => {
  try {
    const [totals]    = await dbQuery("SELECT COUNT(*) AS total, SUM(data_count) AS totalRecords FROM file_uploads");
    const [correct]   = await dbQuery("SELECT COUNT(*) AS count, SUM(data_count) AS records FROM file_uploads WHERE status = 'Correct'");
    const [wrong]     = await dbQuery("SELECT COUNT(*) AS count, SUM(data_count) AS records FROM file_uploads WHERE status = 'Wrong'");
    const vendorStats = await dbQuery("SELECT vendor, COUNT(*) AS files, SUM(data_count) AS records, SUM(status='Correct') AS correct, SUM(status='Wrong') AS wrong FROM file_uploads GROUP BY vendor ORDER BY files DESC");
    const dailyTrend  = await dbQuery("SELECT DATE(created_at) AS day, COUNT(*) AS uploads FROM file_uploads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY day ASC");

    res.json({
      totals:   { files: totals.total || 0, records: totals.totalRecords || 0 },
      correct:  { files: correct.count || 0, records: correct.records || 0 },
      wrong:    { files: wrong.count || 0,   records: wrong.records   || 0 },
      accuracy: totals.total > 0 ? Math.round((correct.count / totals.total) * 100) : 0,
      vendorStats,
      dailyTrend,
    });
  } catch (err) {
    console.error("❌ STATS ERROR:", err.message);
    res.status(500).json({ error: "Stats fetch failed", details: err.message });
  }
});

/* =========================
   ✅ GET ALL VENDORS LIST
========================= */
app.get("/api/vendors", async (req, res) => {
  try {
    const results = await dbQuery(
      "SELECT vendor, COUNT(*) AS file_count, MAX(created_at) AS last_upload FROM file_uploads GROUP BY vendor ORDER BY vendor ASC"
    );
    res.json(results);
  } catch (err) {
    console.error("❌ VENDORS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch vendors", details: err.message });
  }
});

/* =========================
   ✅ EXPORT VENDOR DATA
========================= */
app.get("/api/export/:vendor", async (req, res) => {
  try {
    const { vendor } = req.params;
    const { format = "json" } = req.query;

    const results = await dbQuery(
      "SELECT id, vendor, file_name, data_count, status, file_path, created_at FROM file_uploads WHERE vendor = ? ORDER BY created_at DESC",
      [vendor]
    );

    if (format === "csv") {
      const headers = ["ID", "Vendor", "File Name", "Data Count", "Status", "Created At"];
      const rows = results.map((r) => [
        r.id,
        r.vendor,
        `"${r.file_name}"`,
        r.data_count,
        r.status,
        new Date(r.created_at).toISOString(),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${vendor}_export.csv"`);
      return res.send(csv);
    }

    res.json({ vendor, count: results.length, data: results });
  } catch (err) {
    console.error("❌ EXPORT ERROR:", err.message);
    res.status(500).json({ error: "Export failed", details: err.message });
  }
});

/* =========================
   ✅ MULTER ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 50MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error("❌ UNHANDLED ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
  next();
});

/* =========================
   ✅ VITE / STATIC SETUP
========================= */
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      root: path.resolve(process.cwd(), ".."),
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);

    app.get(/(.*)/, async (req, res, next) => {
      const url = req.originalUrl;

      if (url.startsWith("/api/")) return next();

      try {
        let template = fs.readFileSync(
          path.resolve(process.cwd(), "..", "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), "..", "dist");
    app.use(express.static(distPath));

    app.get(/(.*)/, (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  /* =========================
     ✅ START SERVER (once)
  ========================= */
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Server running → http://localhost:${PORT}`);
    console.log(`📁 Uploads dir   → ${UPLOADS_DIR}`);
    console.log(`🌐 Environment   → ${process.env.NODE_ENV || "development"}\n`);
  });
}

setupVite().catch((err) => {
  console.error("❌ STARTUP ERROR:", err);
  process.exit(1);
});
