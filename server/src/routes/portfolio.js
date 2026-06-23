import express from "express";
import { readPortfolioContent, readVideoOverrides } from "../Config/VideoOverrides.js";

const router = express.Router();

const portfolio = {
  name: "Prince Yadav",
  role: "Professional Video Editor and Cinematographer",
  availability: "Open to studio roles, freelance edits, and remote collaborations",
  services: [
    "Commercial editing",
    "Photography studio content",
    "Creator and social packages",
    "Post-production finish"
  ],
  projects: [
    "Fashion Campaign Reel",
    "Launch Film",
    "Creator Growth Pack",
    "Wedding Highlight Film",
    "Documentary Cut"
  ],
  tools: [
    "Premiere Pro",
    "After Effects",
    "DaVinci Resolve",
    "Photoshop",
    "Lightroom"
  ]
};

router.get("/", (_request, response) => {
  response.json(portfolio);
});

router.get("/video-overrides", async (_request, response, next) => {
  try {
    const overrides = await readVideoOverrides();
    const publicOverrides = Object.fromEntries(
      Object.entries(overrides).map(([projectId, override]) => [
        projectId,
        {
          deleted: Boolean(override.deleted),
          video: override.video || ""
        }
      ])
    );

    response.json(publicOverrides);
  } catch (error) {
    next(error);
  }
});

router.get("/content-overrides", async (_request, response, next) => {
  try {
    const content = await readPortfolioContent();
    const cleanCollection = (collection, field) =>
      Object.fromEntries(
        Object.entries(collection || {}).map(([id, item]) => [
          id,
          {
            deleted: Boolean(item.deleted),
            ...item,
            [field]: item[field] || "",
            publicId: undefined,
            resourceType: undefined
          }
        ])
      );

    response.json({
      projects: cleanCollection(content.projects, "video"),
      customProjects: cleanCollection(content.customProjects, "video"),
      samples: cleanCollection(content.samples, "src"),
      portraits: cleanCollection(content.portraits, "src"),
      resume: content.resume?.url ? { url: content.resume.url } : null,
      profile: content.profile || {},
      sections: content.sections || {},
      stats: Array.isArray(content.stats) ? content.stats : null,
      studioFit: Array.isArray(content.studioFit) ? content.studioFit : null,
      capabilities: Array.isArray(content.capabilities) ? content.capabilities : null,
      tools: Array.isArray(content.tools) ? content.tools : null,
      processSteps: Array.isArray(content.processSteps) ? content.processSteps : null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
