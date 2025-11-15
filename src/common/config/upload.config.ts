import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';

export const UPLOAD_ROOT = join(process.cwd(), 'uploads');
export const EVENT_IMAGES_DIR = join(UPLOAD_ROOT, 'events');
export const EVENT_IMAGES_PUBLIC_PREFIX = '/uploads/events';

const ensureDir = (dirPath: string) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

export const ensureUploadDirs = () => {
  ensureDir(UPLOAD_ROOT);
  ensureDir(EVENT_IMAGES_DIR);
};

export const getEventImagePublicPath = (filename: string) =>
  `${EVENT_IMAGES_PUBLIC_PREFIX}/${filename}`.replace(/\\/g, '/');

export const resolvePublicPathToAbsolute = (publicPath: string) => {
  if (!publicPath) {
    return '';
  }

  const normalized = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  return join(process.cwd(), normalized);
};

export const eventImagesMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDirs();
      cb(null, EVENT_IMAGES_DIR);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = extname(file.originalname) || '.png';
      cb(null, `${uniqueSuffix}${extension}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5,
  },
};


