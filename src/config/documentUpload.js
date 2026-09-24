const fs = require('fs');
const path = require('path');
const multer = require('multer');

const documentUploadDir = path.join(__dirname, '..', '..', 'uploads', 'documents');

fs.mkdirSync(documentUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentUploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.png', '.jpg', '.jpeg'];

  if (allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  return cb(new Error('Formato de documento nao permitido.'));
}

const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

module.exports = {
  documentUpload,
  documentUploadDir
};
