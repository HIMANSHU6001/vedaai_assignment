import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'text/plain'];
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || fileExtension === 'pdf' || fileExtension === 'txt') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and plain text files are accepted'));
    }
  },
});
