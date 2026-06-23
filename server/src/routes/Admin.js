import crypto from "crypto";
import express from "express";
import {
  deleteFromCloudinary,
  getCloudinaryAssetFromUrl
} from "../Config/Cloudinary.js";
import {
  readPortfolioContent,
  readVideoOverrides,
  savePortfolioContent,
  saveVideoOverrides
} from "../Config/VideoOverrides.js";

const router = express.Router();

const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const tokenSecret = process.env.ADMIN_TOKEN_SECRET || "portfolio-local-admin-secret";
const tokenLifetimeMs = 1000 * 60 * 60 * 12;

const hashValue = (value) => crypto.createHash("sha256").update(String(value)).digest();

const passwordsMatch = (candidate) =>
  crypto.timingSafeEqual(hashValue(candidate), hashValue(adminPassword));

const signPayload = (payload) =>
  crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");

const createToken = (username) => {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      expiresAt: Date.now() + tokenLifetimeMs
    })
  ).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expectedSignature = signPayload(payload);

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!decoded.expiresAt || decoded.expiresAt < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

const requireAdmin = (request, response, next) => {
  const authHeader = request.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const admin = verifyToken(token);

  if (!admin) {
    return response.status(401).json({ message: "Admin login required" });
  }

  request.admin = admin;
  return next();
};

const isValidCloudinaryUrl = (value, resourceType) => {
  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname === "res.cloudinary.com" &&
      segments.length >= 4 &&
      (!resourceType || segments[1] === resourceType) &&
      segments[2] === "upload"
    );
  } catch {
    return false;
  }
};

const getProjectSafeId = (title) =>
  String(title || "project")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "project";

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeProjectPayload = (payload, fallback = {}) => ({
  ...fallback,
  title: String(payload.title || fallback.title || "").trim(),
  type: String(payload.type || fallback.type || "Wedding").trim(),
  discipline: String(payload.discipline || fallback.discipline || "Wedding").trim(),
  featured: Boolean(payload.featured ?? fallback.featured),
  year: String(payload.year || fallback.year || new Date().getFullYear()).trim(),
  result: String(payload.result || fallback.result || "").trim(),
  description: String(payload.description || fallback.description || "").trim(),
  tags: toList(payload.tags || fallback.tags),
  metrics: toList(payload.metrics || fallback.metrics),
  video: String(payload.video || fallback.video || "").trim()
});

const targetConfig = {
  "project-video": {
    collection: "projects",
    field: "video",
    folder: "prince-portfolio/project-videos",
    resourceType: "video"
  },
  "custom-project-video": {
    collection: "customProjects",
    field: "video",
    folder: "prince-portfolio/project-videos",
    resourceType: "video"
  },
  "sample-video": {
    collection: "samples",
    field: "src",
    folder: "prince-portfolio/sample-videos",
    resourceType: "video"
  },
  portrait: {
    collection: "portraits",
    field: "src",
    folder: "prince-portfolio/portraits",
    resourceType: "image"
  }
};

const getStoredAsset = (entry, field) => {
  if (!entry) {
    return null;
  }

  return {
    publicId: entry.publicId,
    resourceType: entry.resourceType,
    ...getCloudinaryAssetFromUrl(entry[field] || entry.url)
  };
};

router.post("/login", (request, response) => {
  const { username, password } = request.body;

  if (username !== adminUsername || !passwordsMatch(password || "")) {
    return response.status(401).json({ message: "Invalid admin username or password" });
  }

  return response.json({
    token: createToken(username),
    username
  });
});

router.get("/content-overrides", requireAdmin, async (_request, response, next) => {
  try {
    response.json(await readPortfolioContent());
  } catch (error) {
    next(error);
  }
});

router.put("/content/text", requireAdmin, async (request, response, next) => {
  try {
    const content = await readPortfolioContent();
    const {
      profile,
      sections,
      stats,
      studioFit,
      capabilities,
      tools,
      processSteps
    } = request.body;

    content.profile = profile && typeof profile === "object" ? profile : {};
    content.sections = sections && typeof sections === "object" ? sections : {};
    content.stats = Array.isArray(stats) ? stats : null;
    content.studioFit = Array.isArray(studioFit) ? studioFit : null;
    content.capabilities = Array.isArray(capabilities) ? capabilities : null;
    content.tools = Array.isArray(tools) ? tools : null;
    content.processSteps = Array.isArray(processSteps) ? processSteps : null;

    const savedContent = await savePortfolioContent(content);
    return response.json(savedContent);
  } catch (error) {
    next(error);
  }
});

router.post("/projects", requireAdmin, async (request, response, next) => {
  try {
    const content = await readPortfolioContent();
    const title = String(request.body.title || "").trim();
    const video = String(request.body.video || "").trim();

    if (!title) {
      return response.status(400).json({ message: "Project title is required" });
    }

    if (video && !isValidCloudinaryUrl(video, "video")) {
      return response.status(400).json({ message: "Please enter a valid Cloudinary video URL" });
    }

    const projectId = `${getProjectSafeId(title)}-${Date.now()}`;
    content.customProjects[projectId] = normalizeProjectPayload(request.body, {
      id: projectId,
      video,
      isCustom: true,
      updatedAt: new Date().toISOString()
    });

    await savePortfolioContent(content);
    return response.status(201).json(content.customProjects[projectId]);
  } catch (error) {
    next(error);
  }
});

router.put("/projects/:projectId", requireAdmin, async (request, response, next) => {
  try {
    const projectId = String(request.params.projectId || "").trim();
    const content = await readPortfolioContent();
    const existingProject = content.customProjects[projectId];

    if (!existingProject) {
      return response.status(404).json({ message: "Custom project was not found" });
    }

    const video = String(request.body.video || existingProject.video || "").trim();

    if (video && !isValidCloudinaryUrl(video, "video")) {
      return response.status(400).json({ message: "Please enter a valid Cloudinary video URL" });
    }

    content.customProjects[projectId] = normalizeProjectPayload(request.body, {
      ...existingProject,
      id: projectId,
      video,
      isCustom: true,
      updatedAt: new Date().toISOString()
    });

    await savePortfolioContent(content);
    return response.json(content.customProjects[projectId]);
  } catch (error) {
    next(error);
  }
});

router.delete("/projects/:projectId", requireAdmin, async (request, response, next) => {
  try {
    const projectId = String(request.params.projectId || "").trim();
    const content = await readPortfolioContent();

    await deleteFromCloudinary(getStoredAsset(content.customProjects[projectId], "video"));
    delete content.customProjects[projectId];
    await savePortfolioContent(content);

    return response.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

router.put("/media-url/resume", requireAdmin, async (request, response, next) => {
  try {
    const url = String(request.body.url || "").trim();

    if (!isValidCloudinaryUrl(url)) {
      return response.status(400).json({ message: "Please enter a valid Cloudinary resume URL" });
    }

    const content = await readPortfolioContent();
    const uploadedAsset = getCloudinaryAssetFromUrl(url);

    await deleteFromCloudinary(getStoredAsset(content.resume, "url"));

    content.resume = {
      url,
      publicId: uploadedAsset?.publicId,
      resourceType: uploadedAsset?.resourceType,
      updatedAt: new Date().toISOString()
    };

    await savePortfolioContent(content);
    return response.json(content.resume);
  } catch (error) {
    next(error);
  }
});

router.put("/media-url/:targetType/:targetId", requireAdmin, async (request, response, next) => {
  try {
    const targetType = String(request.params.targetType || "").trim();
    const targetId = String(request.params.targetId || "").trim();
    const url = String(request.body.url || "").trim();
    const config = targetConfig[targetType];

    if (!config || !targetId) {
      return response.status(400).json({ message: "Invalid media target" });
    }

    if (!isValidCloudinaryUrl(url, config.resourceType)) {
      return response.status(400).json({ message: `Please enter a valid Cloudinary ${config.resourceType} URL` });
    }

    const content = await readPortfolioContent();
    const collection = content[config.collection] || {};
    const existingEntry = collection[targetId];
    const uploadedAsset = getCloudinaryAssetFromUrl(url);

    await deleteFromCloudinary(getStoredAsset(existingEntry, config.field));

    collection[targetId] = {
      ...existingEntry,
      deleted: false,
      [config.field]: url,
      publicId: uploadedAsset?.publicId,
      resourceType: uploadedAsset?.resourceType || config.resourceType,
      updatedAt: new Date().toISOString()
    };

    content[config.collection] = collection;
    await savePortfolioContent(content);

    return response.json(collection[targetId]);
  } catch (error) {
    next(error);
  }
});

router.delete("/media/:targetType/:targetId", requireAdmin, async (request, response, next) => {
  try {
    const targetType = String(request.params.targetType || "").trim();
    const targetId = String(request.params.targetId || "").trim();
    const config = targetConfig[targetType];

    if (!config || !targetId) {
      return response.status(400).json({ message: "Invalid media target" });
    }

    const content = await readPortfolioContent();
    const collection = content[config.collection] || {};
    const existingEntry = collection[targetId];

    await deleteFromCloudinary(getStoredAsset(existingEntry, config.field));

    collection[targetId] = {
      deleted: true,
      [config.field]: "",
      updatedAt: new Date().toISOString()
    };

    content[config.collection] = collection;
    await savePortfolioContent(content);

    return response.json(collection[targetId]);
  } catch (error) {
    next(error);
  }
});

router.delete("/media/resume", requireAdmin, async (_request, response, next) => {
  try {
    const content = await readPortfolioContent();

    await deleteFromCloudinary(getStoredAsset(content.resume, "url"));
    content.resume = null;
    await savePortfolioContent(content);

    return response.json({ restored: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/content-overrides/:targetType/:targetId", requireAdmin, async (request, response, next) => {
  try {
    const targetType = String(request.params.targetType || "").trim();
    const targetId = String(request.params.targetId || "").trim();
    const config = targetConfig[targetType];

    if (!config || !targetId) {
      return response.status(400).json({ message: "Invalid media target" });
    }

    const content = await readPortfolioContent();
    const collection = content[config.collection] || {};

    await deleteFromCloudinary(getStoredAsset(collection[targetId], config.field));
    delete collection[targetId];
    content[config.collection] = collection;
    await savePortfolioContent(content);

    return response.json({ restored: true });
  } catch (error) {
    next(error);
  }
});

router.get("/video-overrides", requireAdmin, async (_request, response, next) => {
  try {
    response.json(await readVideoOverrides());
  } catch (error) {
    next(error);
  }
});

router.put("/video-overrides/:projectId", requireAdmin, async (request, response, next) => {
  try {
    const projectId = request.params.projectId.trim();
    const video = String(request.body.video || "").trim();
    const deleted = Boolean(request.body.deleted);

    if (!projectId) {
      return response.status(400).json({ message: "Project id is required" });
    }

    if (!deleted && !isValidCloudinaryUrl(video, "video")) {
      return response.status(400).json({ message: "Please enter a valid Cloudinary video URL" });
    }

    const overrides = await readVideoOverrides();
    const existingEntry = overrides[projectId];

    await deleteFromCloudinary(getStoredAsset(existingEntry, "video"));

    overrides[projectId] = {
      deleted,
      video: deleted ? "" : video,
      ...(!deleted ? getCloudinaryAssetFromUrl(video) : {}),
      updatedAt: new Date().toISOString()
    };

    await saveVideoOverrides(overrides);
    return response.json(overrides[projectId]);
  } catch (error) {
    next(error);
  }
});

router.delete("/video-overrides/:projectId", requireAdmin, async (request, response, next) => {
  try {
    const projectId = request.params.projectId.trim();
    const overrides = await readVideoOverrides();

    await deleteFromCloudinary(getStoredAsset(overrides[projectId], "video"));
    delete overrides[projectId];
    await saveVideoOverrides(overrides);

    return response.json({ restored: true });
  } catch (error) {
    next(error);
  }
});

export default router;
