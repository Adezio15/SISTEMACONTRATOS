const fs = require('fs');
const path = require('path');
const multer = require('multer');

const importUploadDir = path.join(__dirname, '..', '..', 'uploads', 'imports');

fs.mkdirSync(importUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, importUploadDir),
  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeOriginalName}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(file.mimetype) || ['.csv', '.xls', '.xlsx'].includes(extension)) {
    return cb(null, true);
  }

  return cb(new Error('Formato de arquivo nao permitido. Envie .xlsx, .xls ou .csv.'));
}

const importUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  importUpload,
  importUploadDir
};
