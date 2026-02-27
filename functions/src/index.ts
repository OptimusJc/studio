import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const bucket = admin.storage().bucket();

export const serveImage = functions.https.onRequest(async (req, res) => {
  try {
    const originalPath = req.path || req.url.split("?")[0];
    let filePath = originalPath
      .replace(/^\/product-images\//, "")
      .replace(/^\//, "");

    filePath = decodeURIComponent(filePath.trim());

    if (!filePath) {
      res.status(400).send("Invalid image path");
      return;
    }

    const file = bucket.file(`product-images/${filePath}`);
    const [exists] = await file.exists();

    if (!exists) {
      res.status(400).send("Image not found");
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
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});
