import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage();

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedExtensions = [".txt", ".text", ".md", ".pdf"];
    const ext = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase();

    const allowedMimeTypes = [
        "text/plain",
        "text/markdown",
        "application/pdf",
        "application/x-pdf",
        "application/octet-stream", // Some clients send binary for txt/pdf
    ];

    if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only .txt, .md, and .pdf files are supported (received ${file.originalname})`));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max
        files: 1,
    },
});
