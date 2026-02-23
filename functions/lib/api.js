"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiHandler = void 0;
const admin = __importStar(require("firebase-admin"));
const express = __importStar(require("express"));
const cors = __importStar(require("cors"));
// Initialize Firebase Admin (if not already initialized in index.ts, but standard practice is to let index do it or check here)
// However, index.ts already does admin.initializeApp(), so we might just use admin directly.
// But to be safe and modular, we can check.
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const app = express();
// Enable CORS
app.use(cors({ origin: true }));
// Caching middleware
const cacheMiddleware = (req, res, next) => {
    // Cache for 5 minutes in browser, 10 minutes in CDN
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    next();
};
app.use(cacheMiddleware);
// Helper to sanitize product data
const sanitizeProduct = (doc, id, categoryName, dbName) => {
    var _a;
    const data = doc;
    return {
        id: id,
        name: data.productTitle,
        productTitle: data.productTitle,
        productCode: data.productCode,
        productDescription: data.productDescription,
        category: categoryName || data.category || "",
        price: data.price,
        status: "Published", // We only fetch published
        attributes: data.attributes,
        imageUrl: ((_a = data.productImages) === null || _a === void 0 ? void 0 : _a[0]) || "https://placehold.co/600x600",
        productImages: data.productImages,
        additionalImages: data.additionalImages,
        specifications: data.specifications,
        db: dbName || data.db || "retailers", // Default or from params
        stock: data.stock || 0,
        stockStatus: data.stockStatus,
        sku: data.sku || "",
        imageHint: data.imageHint || "",
        createdAt: data.createdAt ? (typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().toISOString() : data.createdAt) : "",
    };
};
// GET /products
app.get("/products", async (req, res) => {
    try {
        const dbName = req.query.db || "buyers"; // Standardize on 'buyers' for the shop as per original code logic
        // 1. Fetch Categories first to map slugs to names (similar to original code)
        const categoriesSnap = await db.collection("categories").get();
        const categories = categoriesSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const productCategories = categories.map((c) => ({
            slug: c.name.toLowerCase().replace(/\s+/g, "-"),
            name: c.name,
        }));
        const allProducts = [];
        // Parallel fetch for all categories
        // Note: This matches the original "loop over categories" logic but does it server-side.
        // Ideally, we'd have a collection group query or specific structure, but adhering to current schema.
        const promises = productCategories.map(async (cat) => {
            const collectionPath = `${dbName}/${cat.slug}/products`;
            const q = db.collection(collectionPath).where("status", "==", "Published");
            const snap = await q.get();
            return snap.docs.map((doc) => sanitizeProduct(doc.data(), doc.id, cat.name, dbName));
        });
        const results = await Promise.all(promises);
        results.forEach((products) => allProducts.push(...products));
        res.json(allProducts);
    }
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});
// GET /categories
app.get("/categories", async (req, res) => {
    try {
        const categoriesSnap = await db.collection("categories").get();
        const categories = categoriesSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
// GET /products/:id
// This might be tricky because we need to know the category/slug to find the path in the current DB structure.
// If the client knows the category, they should pass it.
// If not, we might have to search or the ID should be unique enough?
// Currently, the schema seems to be `db/category-slug/products/docId`.
// Without category, we'd have to Query Group or search.
// For now, let's assume filtering happens on client or we don't strictly need individual fetch yet
// OR we can implement a collection group query if IDs are unique.
app.get("/products/:id", async (req, res) => {
    // TODO: Implement efficiently. Collection Group Query is best if IDs are unique across categories.
    // For now, returning 501 Not Implemented or basic search if needed.
    // Given the current shop page loads ALL and filters, strict individual fetch might not be used yet.
    // We will implement a collection group query for "products" just in case.
    try {
        // Query all 'products' collections for this ID
        // Note: 'products' is the subcollection name.
        // Collection Group queries require an index if filtering, but get() on specific path doesn't work without path.
        // We can't easily "get by ID" without path in Firestore unless we use proper indexing.
        // However, we can use a Collection Group Query with `FieldPath.documentId()`.
        // Let's defer this complex query unless requested, as the main page loads ALL.
        res.status(501).send("Specific product fetch not yet optimized for this schema.");
    }
    catch (e) {
        res.status(500).send(e.toString());
    }
});
exports.apiHandler = app;
//# sourceMappingURL=api.js.map