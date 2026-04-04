import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const bucket = admin.storage().bucket();

export const serveImage = functions.https.onRequest(async (req, res) => {
  try {
    // Log the incoming path for debugging (check Cloud Functions logs)
    console.log("Incoming req.path:", req.path);
    console.log("Incoming req.url:", req.url);
    console.log(
      "Full req:",
      JSON.stringify({
        method: req.method,
        headers: req.headers,
        path: req.path,
      }),
    );

    // Normalize: remove leading /product-images/
    // (with or without trailing slash variations)
    let filepath = (req.path || "")
      // handles /product-images/abc.jpg or /product-images/abc.jpg/
      .replace(/^\/product-images\/?/, "")
      .replace(/^\//, "") // in case extra leading slash somehow appears
      .trim();

    // handle any %2F or encoded chars if needed
    filepath = decodeURIComponent(filepath);
    console.log("Extracted filepath:", filepath);

    if (!filepath) {
      res.status(400).type("text/plain").send("Invalid image path");
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

    // set aggresive cache headers
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader(
      "Content-Type",
      metadata.contentType || "application/octet-stream",
    );

    // steam file to response
    file.createReadStream().pipe(res);
  } catch (err) {
    console.log("Error serving image", err);
    res.status(500).type("text/plain").send("Internal Server Error");
  }
});
