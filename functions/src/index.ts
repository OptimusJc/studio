import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import sharp from "sharp";

admin.initializeApp();

const bucket = admin.storage().bucket();

// Domains allowed to request images.
// Add your production domain, CDN origin, and any other trusted consumers.
const ALLOWED_ORIGINS = [
  "https://rubycatalogue.co.ke",
  "https://www.rubycatalogue.co.ke",
  "https://cdn.rubycatalogue.co.ke",
];

function isAllowedOrigin(req: functions.https.Request): boolean {
  const origin = req.headers["origin"] as string | undefined;
  const referer = req.headers["referer"] as string | undefined;

  // Allow requests with no origin/referer (direct CDN fetches, server-side rendering)
  if (!origin && !referer) return true;

  const source = origin || referer || "";

  // Allow localhost during development
  if (source.includes("localhost") || source.includes("127.0.0.1")) {
    return true;
  }

  return ALLOWED_ORIGINS.some((allowed) => source.startsWith(allowed));
}

export const serveImage = functions.https.onRequest(
  { memory: "1GiB" },
  async (req: functions.https.Request, res: any) => {
  // 1. GET only
  if (req.method !== "GET") {
    res.status(405).set("Allow", "GET").type("text/plain").send("Method Not Allowed");
    return;
  }

  // 2. Origin / Referer allowlist — stops hotlinking from unknown domains
  if (!isAllowedOrigin(req)) {
    res.status(403).type("text/plain").send("Forbidden");
    return;
  }

  // Set CORS header for allowed browser origins
  const origin = req.headers["origin"] as string | undefined;
  if (origin && ALLOWED_ORIGINS.some((a) => origin.startsWith(a))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  try {
    // Normalize: remove leading /product-images/
    let filepath = (req.path || "")
      .replace(/^\/product-images\/?/, "")
      .replace(/^\//, "")
      .trim();

    filepath = decodeURIComponent(filepath);

    // 3. Path traversal guard — reject paths trying to escape the folder
    if (!filepath || filepath.includes("..") || filepath.startsWith("/")) {
      res.status(400).type("text/plain").send("Invalid image path");
      return;
    }

    // 4. File extension guard — only allow known image types
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExtension = filepath.slice(filepath.lastIndexOf(".")).toLowerCase();

    if (!filepath.includes(".") || !allowedExtensions.includes(fileExtension)) {
      res.status(403).type("text/plain").send("Forbidden file type");
      return;
    }

    const file = bucket.file(`product-images/${filepath}`);

    const [exists] = await file.exists();
    if (!exists) {
      console.log(`File not found: product-images/${filepath}`);
      res.status(404).type("text/plain").send("Image not found");
      return;
    }

    const [metadata] = await file.getMetadata();

    // Parse query params for resizing
    const width = req.query.w ? parseInt(req.query.w as string, 10) : undefined;
    const height = req.query.h ? parseInt(req.query.h as string, 10) : undefined;
    const quality = req.query.q ? parseInt(req.query.q as string, 10) : 80;
    
    // Determine target format (respect explicit query, fallback to Accept headers)
    const acceptHeader = req.headers.accept || "";
    let format = (req.query.fm as string) || "";
    
    if (!format) {
      if (acceptHeader.includes("image/avif")) format = "avif";
      else if (acceptHeader.includes("image/webp")) format = "webp";
      else format = "jpeg"; // standard fallback
    }

    let transform = sharp();

    // Prevent malicious huge resize requests by capping max sizes
    if (width || height) {
      const safeWidth = width ? Math.min(width, 2000) : undefined;
      const safeHeight = height ? Math.min(height, 2000) : undefined;
      transform = transform.resize(safeWidth, safeHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let contentType = metadata.contentType || "application/octet-stream";
    if (format === "avif") {
      // effort 4 is a good balance of encoding speed and compression size
      transform = transform.avif({ quality, effort: 4 });
      contentType = "image/avif";
    } else if (format === "webp") {
      transform = transform.webp({ quality });
      contentType = "image/webp";
    } else if (format === "jpeg" || format === "jpg") {
      transform = transform.jpeg({ quality, progressive: true });
      contentType = "image/jpeg";
    } else if (format === "png") {
      transform = transform.png({ quality });
      contentType = "image/png";
    }

    // Aggressive cache headers — images are immutable by filename convention
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", contentType);

    // Pipe storage stream -> sharp -> response
    file.createReadStream().pipe(transform).pipe(res);
  } catch (err) {
    console.error("Error serving image:", err);
    res.status(500).type("text/plain").send("Internal Server Error");
  }
});
