import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import PortfolioContent from "../models/PortfolioContent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../data");
const overridesPath = path.join(dataDirectory, "video-overrides.json");
const portfolioContentKey = "main";

const createDefaultContent = () => ({
  projects: {},
  customProjects: {},
  samples: {},
  portraits: {},
  resume: null,
  profile: {},
  sections: {},
  stats: null,
  studioFit: null,
  capabilities: null,
  tools: null,
  processSteps: null
});

const isDatabaseReady = () => mongoose.connection.readyState === 1;
const shouldUseDatabase = () => Boolean(process.env.MONGODB_URI);

const normalizeContent = (content) => {
  if (!content || typeof content !== "object") {
    return createDefaultContent();
  }

  if ("projects" in content || "samples" in content || "portraits" in content || "resume" in content) {
    return {
      ...createDefaultContent(),
      ...content,
      projects: content.projects || {},
      customProjects: content.customProjects || {},
      samples: content.samples || {},
      portraits: content.portraits || {},
      resume: content.resume || null,
      profile: content.profile || {},
      sections: content.sections || {},
      stats: Array.isArray(content.stats) ? content.stats : null,
      studioFit: Array.isArray(content.studioFit) ? content.studioFit : null,
      capabilities: Array.isArray(content.capabilities) ? content.capabilities : null,
      tools: Array.isArray(content.tools) ? content.tools : null,
      processSteps: Array.isArray(content.processSteps) ? content.processSteps : null
    };
  }

  return {
    ...createDefaultContent(),
    projects: content
  };
};

const readFileContent = async () => {
  try {
    const rawOverrides = await fs.readFile(overridesPath, "utf8");
    return normalizeContent(JSON.parse(rawOverrides));
  } catch (error) {
    if (error.code === "ENOENT") {
      return createDefaultContent();
    }

    throw error;
  }
};

const saveFileContent = async (content) => {
  const normalizedContent = normalizeContent(content);

  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(overridesPath, `${JSON.stringify(normalizedContent, null, 2)}\n`);

  return normalizedContent;
};

export const readPortfolioContent = async () => {
  if (!isDatabaseReady()) {
    return readFileContent();
  }

  const savedContent = await PortfolioContent.findOne({ key: portfolioContentKey }).lean();

  if (savedContent?.content) {
    return normalizeContent(savedContent.content);
  }

  return readFileContent();
};

export const savePortfolioContent = async (content) => {
  const normalizedContent = normalizeContent(content);

  if (shouldUseDatabase() && !isDatabaseReady()) {
    throw new Error("MongoDB is not connected. Admin changes were not saved.");
  }

  if (!isDatabaseReady()) {
    return saveFileContent(normalizedContent);
  }

  await PortfolioContent.findOneAndUpdate(
    { key: portfolioContentKey },
    { $set: { content: normalizedContent } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return normalizedContent;
};

export const readVideoOverrides = async () => {
  const content = await readPortfolioContent();
  return content.projects;
};

export const saveVideoOverrides = async (overrides) => {
  const content = await readPortfolioContent();
  content.projects = overrides;
  await savePortfolioContent(content);

  return overrides;
};
