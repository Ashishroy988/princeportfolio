import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Clapperboard,
  Clock3,
  Film,
  Globe2,
  Layers3,
  Mail,
  MapPin,
  MessageCircle,
  MonitorPlay,
  Play,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wand2,
  Instagram,
  Lock,
  LogOut,
  Maximize2,
  RotateCcw,
  Save,
  Trash2
} from "lucide-react";


import React, { useEffect, useMemo, useRef, useState } from "react";
import heroImage from "./assets/editing-suite-hero.png";
import {
  capabilities,
  editorProfile as baseEditorProfile,
  mediaSamples as baseMediaSamples,
  portraits as basePortraits,
  processSteps,
  projects as baseProjects,
  stats as baseStats,
  studioFit as baseStudioFit,
  tools as baseTools
} from "./data";

const apiUrl =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname || "localhost"}:5000`;
const serviceOptions = ["Studio role", "Commercial", "Photography studio", "Social media", "Wedding", "Other"];

const defaultSections = {
  positioningEyebrow: "Positioning",
  positioningTitle: "Built for studios that need taste, speed, and dependable post-production.",
  samplesEyebrow: "Sample Reels",
  samplesTitle: "Wedding stories shaped through cinematic editing and emotional storytelling.",
  samplesDescription: "Wedding films and celebration reels edited to preserve emotions and unforgettable moments.",
  workEyebrow: "Featured Projects",
  workTitle: "A showcase of wedding films, celebration reels, and cinematic edits.",
  capabilitiesEyebrow: "Capabilities",
  capabilitiesTitle: "Wedding filmmaking expertise from edit to final delivery.",
  processEyebrow: "Process",
  processTitle: "A streamlined process for crafting polished wedding films.",
  contactEyebrow: "Contact",
  contactTitle: "Tell me about your celebration, and let's craft something unforgettable.",
  contactDescription: "Tell us about your wedding, event details, and vision. We'll get back to you with availability and next steps."
};

const getProjectId = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getSampleId = (title) => `sample-${getProjectId(title)}`;
const getPortraitId = (index) => `portrait-${index}`;

const applyCollectionOverrides = (items, overrides, idGetter, field) =>
  items
    .map((item, index) => {
      const override = overrides?.[idGetter(item, index)];

      if (!override) {
        return item;
      }

      if (override.deleted) {
        return null;
      }

      return {
        ...item,
        [field]: override[field] || item[field]
      };
    })
    .filter(Boolean);

const applyContentOverrides = (content = {}) => ({
  projects: [
    ...applyCollectionOverrides(baseProjects, content.projects, (project) => getProjectId(project.title), "video"),
    ...Object.values(content.customProjects || {}).filter((project) => !project.deleted)
  ],
  mediaSamples: applyCollectionOverrides(baseMediaSamples, content.samples, (sample) => getSampleId(sample.title), "src"),
  portraits: applyCollectionOverrides(basePortraits, content.portraits, (_portrait, index) => getPortraitId(index), "src"),
  editorProfile: {
    ...baseEditorProfile,
    ...(content.profile || {}),
    resume: content.resume?.url || baseEditorProfile.resume
  },
  sections: { ...defaultSections, ...(content.sections || {}) },
  stats: Array.isArray(content.stats) ? content.stats : baseStats,
  studioFit: Array.isArray(content.studioFit) ? content.studioFit : baseStudioFit,
  capabilities: Array.isArray(content.capabilities) ? content.capabilities : capabilities,
  tools: Array.isArray(content.tools) ? content.tools : baseTools,
  processSteps: Array.isArray(content.processSteps) ? content.processSteps : processSteps
});

const linesFromList = (items, mapper = (item) => item) => items.map(mapper).join("\n");
const listFromLines = (value) =>
  String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const pairListFromLines = (value, firstKey, secondKey) =>
  listFromLines(value)
    .map((line) => {
      const [first = "", ...rest] = line.split("|");
      return {
        [firstKey]: first.trim(),
        [secondKey]: rest.join("|").trim()
      };
    })
    .filter((item) => item[firstKey] && item[secondKey]);

const createTextDraft = (content = {}) => {
  const profile = { ...baseEditorProfile, ...(content.profile || {}) };
  const sections = { ...defaultSections, ...(content.sections || {}) };

  return {
    profile,
    sections,
    statsText: linesFromList(
      Array.isArray(content.stats) ? content.stats : baseStats,
      (item) => `${item.value}|${item.label}`
    ),
    studioFitText: linesFromList(Array.isArray(content.studioFit) ? content.studioFit : baseStudioFit),
    capabilitiesText: linesFromList(
      Array.isArray(content.capabilities) ? content.capabilities : capabilities,
      (item) => `${item.title}|${item.description}`
    ),
    toolsText: linesFromList(Array.isArray(content.tools) ? content.tools : baseTools),
    processStepsText: linesFromList(
      Array.isArray(content.processSteps) ? content.processSteps : processSteps,
      (item) => `${item.title}|${item.detail}`
    )
  };
};

const textPayloadFromDraft = (draft) => ({
  profile: draft.profile,
  sections: draft.sections,
  stats: pairListFromLines(draft.statsText, "value", "label"),
  studioFit: listFromLines(draft.studioFitText),
  capabilities: pairListFromLines(draft.capabilitiesText, "title", "description"),
  tools: listFromLines(draft.toolsText),
  processSteps: pairListFromLines(draft.processStepsText, "title", "detail")
});

const emptyProjectForm = {
  title: "",
  type: "Wedding",
  discipline: "Wedding",
  featured: true,
  year: String(new Date().getFullYear()),
  result: "",
  description: "",
  tags: "Wedding, Cinematic",
  metrics: "4K export",
  video: ""
};

// ScrollVideo component with scroll-based autoplay and mute toggle


function ScrollVideo({ sample, index }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);


 const handleFullscreen = async () => {
  const video = videoRef.current;
  if (!video) return;

  try {
    if (video.requestFullscreen) {
      await video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  } catch {
    // ignore fullscreen errors
  }
};

 const playSampleVideo = () => {
  const video = videoRef.current;

  if (!video || !isInView) {
    return;
  }

  video.muted = isMuted;
  video.play().catch(() => {});
};



  
  useEffect(() => {
    if (!sample.browserPlayable) {
      return undefined;
    }

    const card = cardRef.current;

    if (!card || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      setIsInView(true);
      return undefined;
    }

    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          loadObserver.disconnect();
        }
      },
      { rootMargin: "1100px 0px", threshold: 0 }
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          return;
        }

        setIsInView(false);
        videoRef.current?.pause();
      },
      { threshold: 0.55 }
    );

    loadObserver.observe(card);
    observer.observe(card);

    return () => {
      loadObserver.disconnect();
      observer.disconnect();
    };
  }, [sample.browserPlayable]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!isInView) {
      video.pause();
      return;
    }

    playSampleVideo();
  }, [isInView, isMuted, sample.src]);

  useEffect(() => {
    if (shouldLoad) {
      videoRef.current?.load();
    }
  }, [sample.src, shouldLoad]);

  if (!sample.browserPlayable) {
    return (
      <article className={`sample-card sample-fallback sample-${(index % 3) + 1}`}>
        <img src={sample.poster} alt={`${sample.title} poster`} />
        <div className="sample-overlay">
          <span>{sample.category}</span>
          <h3>{sample.title}</h3>
          <a href={sample.src} target="_blank" rel="noreferrer">
            Open clip <ArrowUpRight size={16} />
          </a>
        </div>
      </article>
    );
  }




return (
  <article ref={cardRef} className={`sample-card sample-${(index % 3) + 1}`}>
    <video
      ref={videoRef}
      muted={isMuted}
      loop
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      poster={sample.poster}
      onLoadedMetadata={playSampleVideo}
      onLoadedData={playSampleVideo}
      onCanPlay={playSampleVideo}
    >
      {shouldLoad && <source src={sample.src} type="video/mp4" />}
    </video>

    <button
      type="button"
      className="mute-btn"
      onClick={() => setIsMuted(!isMuted)}
      aria-label={isMuted ? "Unmute video" : "Mute video"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>

    <button
      type="button"
      className="fullscreen-btn"
      onClick={handleFullscreen}
      aria-label="Open fullscreen"
    >
      <Maximize2 size={18} />
    </button>

    <div className="sample-overlay">
      <span>{sample.category}</span>
      <h3>{sample.title}</h3>
    </div>
  </article>
);



}

const parseStatValue = (value) => {
  const match = String(value).match(/^(\d+)(.*)$/);

  if (!match) {
    return null;
  }

  return {
    target: Number(match[1]),
    suffix: match[2]
  };
};

function AnimatedStat({ value, label, index }) {
  const parsedValue = parseStatValue(value);
  const [displayValue, setDisplayValue] = useState(parsedValue ? `0${parsedValue.suffix}` : value);

  useEffect(() => {
    const parsed = parseStatValue(value);

    if (!parsed) {
      setDisplayValue(value);
      return undefined;
    }

    let frameId = 0;
    setDisplayValue(`0${parsed.suffix}`);

    const timeoutId = window.setTimeout(() => {
      const duration = 3000;
      const startedAt = performance.now();

      const animate = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextValue = Math.round(parsed.target * easedProgress);

        setDisplayValue(`${nextValue}${parsed.suffix}`);

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
          return;
        }

        setDisplayValue(value);
      };

      frameId = requestAnimationFrame(animate);
    }, 900 + index * 220);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);
    };
  }, [index, value]);

  return (
    <div className="stat-item is-counting">
      <strong>{displayValue}</strong>
      <span>{label}</span>
    </div>
  );
}

function ProjectCard({ project, isActive, onSelect }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const projectMetrics = Array.isArray(project.metrics)
    ? project.metrics
    : String(project.metrics || "")
        .split(",")
        .map((metric) => metric.trim())
        .filter(Boolean);

  const playVideo = () => {
    const video = videoRef.current;

    if (!video || !isVisible || !isPreviewing) {
      return;
    }

    video.muted = isMuted;
    video.play().catch(() => {});
  };

  useEffect(() => {
    const node = cardRef.current;

    if (!node || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      setIsVisible(true);
      return undefined;
    }

    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          loadObserver.disconnect();
        }
      },
      { rootMargin: "1100px 0px", threshold: 0 }
    );

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "120px 0px", threshold: 0.45 }
    );

    loadObserver.observe(node);
    observer.observe(node);

    return () => {
      loadObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!isVisible) {
      video.pause();
      return;
    }

    playVideo();
  }, [isMuted, isPreviewing, isVisible, project.video]);

  const prepareCoverFrame = () => {
    const video = videoRef.current;

    if (!video) return;
    video.currentTime = Number.isFinite(video.duration)
      ? Math.min(0.6, Math.max(video.duration - 0.1, 0))
      : 0;
  };

  const startPreview = () => setIsPreviewing(true);
  const stopPreview = () => {
    const video = videoRef.current;
    setIsPreviewing(false);
    video?.pause();
  };

  const toggleMute = (event) => {
    event.stopPropagation();
    const nextMuted = !isMuted;

    setIsMuted(nextMuted);

    if (!nextMuted) {
      videoRef.current?.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (shouldLoad) {
      videoRef.current?.load();
    }
  }, [project.video, shouldLoad]);

  const openFullscreen = (event) => {
    event.stopPropagation();
    videoRef.current?.requestFullscreen?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <article
      ref={cardRef}
      className={isActive ? "project-card active" : "project-card"}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) stopPreview();
      }}
      aria-label={`Select ${project.title}`}
    >
      <div className={`project-visual ${isPreviewing ? "is-previewing" : ""} ${isFrameReady ? "is-ready" : ""}`}>
        <video
          ref={videoRef}
          src={shouldLoad ? project.video : undefined}
          muted={isMuted}
          loop
          playsInline
          preload={shouldLoad ? "auto" : "none"}
          onLoadedMetadata={prepareCoverFrame}
          onSeeked={() => {
            setIsFrameReady(true);
            playVideo();
          }}
          onCanPlay={playVideo}
        />

        <div className="project-shade" />
        <div className="project-visual-meta">
          <span>{project.type}</span>
          <span>{project.year}</span>
        </div>
        <div className="project-play" aria-hidden="true">
          <Play size={22} fill="currentColor" />
        </div>
        <div className="project-format">
          <span>{projectMetrics[0] || "Highlight film"}</span>
          <span>{projectMetrics[projectMetrics.length - 1] || "HD delivery"}</span>
        </div>

        <button className="mute-btn" type="button" onClick={toggleMute} aria-label={isMuted ? "Unmute video" : "Mute video"}>
          {isMuted ? "🔇" : "🔊"}
        </button>

        <button className="fullscreen-btn" type="button" onClick={openFullscreen} aria-label="Open fullscreen">
          <Maximize2 size={18} />
        </button>

      </div>

      <div className="project-body">
        <p className="project-kicker">Featured work</p>
        <h3>{project.title}</h3>
        <span>{project.result}</span>
        <div className="tag-row">
          {project.tags.map((tag) => (
            <small key={tag}>{tag}</small>
          ))}
        </div>
      </div>
    </article>
  );
}

function AdminDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem("portfolioAdminToken") || "");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [contentOverrides, setContentOverrides] = useState({
    projects: {},
    customProjects: {},
    samples: {},
    portraits: {},
    resume: null,
    profile: {},
    sections: {}
  });
  const [videoInputs, setVideoInputs] = useState({});
  const [mediaInputs, setMediaInputs] = useState({
    resume: "",
    portraits: {},
    samples: {}
  });
  const [textDraft, setTextDraft] = useState(() => createTextDraft());
  const [newProject, setNewProject] = useState(emptyProjectForm);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const adminHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const projectRows = useMemo(
    () =>
      baseProjects.map((project) => {
        const id = getProjectId(project.title);
        const override = contentOverrides.projects?.[id];

        return {
          ...project,
          id,
          currentVideo: override?.video || project.video,
          isRemoved: Boolean(override?.deleted),
          hasOverride: Boolean(override)
        };
      }),
    [contentOverrides.projects]
  );

  const customProjectRows = useMemo(
    () =>
      Object.values(contentOverrides.customProjects || {}).map((project) => ({
        ...project,
        currentVideo: project.video,
        isRemoved: Boolean(project.deleted),
        hasOverride: true
      })),
    [contentOverrides.customProjects]
  );

  const sampleRows = useMemo(
    () =>
      baseMediaSamples.map((sample) => {
        const id = getSampleId(sample.title);
        const override = contentOverrides.samples?.[id];

        return {
          ...sample,
          id,
          currentSrc: override?.src || sample.src,
          isRemoved: Boolean(override?.deleted),
          hasOverride: Boolean(override)
        };
      }),
    [contentOverrides.samples]
  );

  const portraitRows = useMemo(
    () =>
      basePortraits.map((portrait, index) => {
        const id = getPortraitId(index);
        const override = contentOverrides.portraits?.[id];

        return {
          ...portrait,
          id,
          currentSrc: override?.src || portrait.src,
          isRemoved: Boolean(override?.deleted),
          hasOverride: Boolean(override)
        };
      }),
    [contentOverrides.portraits]
  );

  const loadOverrides = async (authToken = token) => {
    if (!authToken) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/admin/content-overrides`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 401) {
        localStorage.removeItem("portfolioAdminToken");
        setToken("");
        setStatus("Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load media settings");
      }

      const nextContentOverrides = await response.json();
      const nextInputs = {};
      const nextMediaInputs = {
        resume: nextContentOverrides.resume?.url || baseEditorProfile.resume,
        portraits: {},
        samples: {}
      };

      baseProjects.forEach((project) => {
        const id = getProjectId(project.title);
        nextInputs[id] = nextContentOverrides.projects?.[id]?.video || project.video;
      });

      basePortraits.forEach((portrait, index) => {
        const id = getPortraitId(index);
        nextMediaInputs.portraits[id] = nextContentOverrides.portraits?.[id]?.src || portrait.src;
      });

      baseMediaSamples.forEach((sample) => {
        const id = getSampleId(sample.title);
        nextMediaInputs.samples[id] = nextContentOverrides.samples?.[id]?.src || sample.src;
      });

      setContentOverrides(nextContentOverrides);
      setTextDraft(createTextDraft(nextContentOverrides));
      setVideoInputs(nextInputs);
      setMediaInputs(nextMediaInputs);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTextContent = async () => {
    setIsLoading(true);
    setStatus("Saving portfolio text...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/content/text`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(textPayloadFromDraft(textDraft))
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to save portfolio text");
      }

      await loadOverrides();
      setStatus("Portfolio text updated.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus("Adding new video project...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/projects`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(newProject)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to add project");
      }

      setNewProject(emptyProjectForm);
      await loadOverrides();
      setStatus("New video project added. You can upload a Cloudinary video for it below.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomProject = async (project) => {
    setStatus("Saving custom project...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to save custom project");
      }

      await loadOverrides();
      setStatus("Custom project updated.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteCustomProject = async (projectId) => {
    setStatus("Deleting custom project...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to delete custom project");
      }

      await loadOverrides();
      setStatus("Custom project deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const saveMediaUrl = async (targetType, targetId, url) => {
    setStatus("Saving Cloudinary URL...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/media-url/${targetType}/${targetId}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to save Cloudinary URL");
      }

      await loadOverrides();
      setStatus("Cloudinary URL saved on the public site.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const saveResumeUrl = async () => {
    setStatus("Saving resume URL...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/media-url/resume`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({ url: mediaInputs.resume })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to save resume URL");
      }

      await loadOverrides();
      setStatus("Resume URL saved on the public site.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const removeMedia = async (targetType, targetId) => {
    setStatus("Deleting Cloudinary media and removing it from the site...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/media/${targetType}/${targetId}`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to remove media");
      }

      await loadOverrides();
      setStatus("Media removed from the public site. Cloudinary file deleted when it was managed by admin.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const restoreMedia = async (targetType, targetId) => {
    setStatus("Restoring original media...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/content-overrides/${targetType}/${targetId}`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to restore media");
      }

      await loadOverrides();
      setStatus("Original media restored.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const removeResume = async () => {
    setStatus("Removing uploaded resume...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/media/resume`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error("Unable to restore original resume");
      }

      await loadOverrides();
      setStatus("Original resume restored.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadOverrides();
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus("Checking admin login...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        throw new Error("Invalid admin username or password");
      }

      const data = await response.json();
      localStorage.setItem("portfolioAdminToken", data.token);
      setToken(data.token);
      setLoginForm({ username: "", password: "" });
      setStatus("Admin login successful.");
      await loadOverrides(data.token);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVideo = async (projectId) => {
    setStatus("Saving video...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/video-overrides/${projectId}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({ video: videoInputs[projectId], deleted: false })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to save video");
      }

      await loadOverrides();
      setStatus("Video updated on the public portfolio.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const removeVideo = async (projectId) => {
    setStatus("Removing video from the public portfolio...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/video-overrides/${projectId}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({ deleted: true })
      });

      if (!response.ok) {
        throw new Error("Unable to remove video");
      }

      await loadOverrides();
      setStatus("Video removed from the public portfolio.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const restoreVideo = async (projectId) => {
    setStatus("Restoring original video...");

    try {
      const response = await fetch(`${apiUrl}/api/admin/video-overrides/${projectId}`, {
        method: "DELETE",
        headers: adminHeaders
      });

      if (!response.ok) {
        throw new Error("Unable to restore original video");
      }

      await loadOverrides();
      setStatus("Original video restored.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("portfolioAdminToken");
    setToken("");
    setContentOverrides({ projects: {}, customProjects: {}, samples: {}, portraits: {}, resume: null, profile: {}, sections: {} });
    setStatus("Logged out.");
  };

  if (!token) {
    return (
      <main className="admin-shell">
        <section className="admin-login">
          <a className="brand" href="/" aria-label="Back to portfolio">
            <Clapperboard size={24} />
            <span>Sonu Kumar</span>
          </a>
          <div>
            <p className="eyebrow">
              <Lock size={16} />
              Admin Login
            </p>
            <h1>Manage portfolio media</h1>
            <p>Login to paste Cloudinary video, photo, and resume URLs, then publish them on the portfolio.</p>
          </div>
          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                value={loginForm.username}
                onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                required
                autoComplete="username"
                placeholder="Admin username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
                autoComplete="current-password"
                placeholder="Admin password"
              />
            </label>
            <button className="button primary" type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
              <Lock size={18} />
            </button>
            {status && <p className="form-status">{status}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="brand" href="/" aria-label="Back to portfolio">
          <Clapperboard size={24} />
          <span>Sonu Kumar</span>
        </a>
        <div className="admin-header-actions">
          <a className="button secondary" href="/">
            View site
            <ArrowUpRight size={18} />
          </a>
          <button className="button secondary" type="button" onClick={logout}>
            Logout
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="admin-panel">
        <div className="section-heading">
          <p className="eyebrow">Cloudinary Manager</p>
          <h1>Upload and manage portfolio media.</h1>
          {status && <p className="admin-status">{status}</p>}
        </div>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Portfolio Text</h2>
            <button className="button primary" type="button" onClick={saveTextContent} disabled={isLoading}>
              Save text
              <Save size={18} />
            </button>
          </div>
          <div className="admin-text-grid">
            <div className="admin-form compact">
              <h3>Profile</h3>
              {["name", "title", "availability", "email", "phone", "location", "instagram", "whatsapp"].map((field) => (
                <label key={field}>
                  {field}
                  <input
                    value={textDraft.profile[field] || ""}
                    onChange={(event) =>
                      setTextDraft({
                        ...textDraft,
                        profile: { ...textDraft.profile, [field]: event.target.value }
                      })
                    }
                  />
                </label>
              ))}
              <label>
                tagline
                <textarea
                  value={textDraft.profile.tagline || ""}
                  onChange={(event) =>
                    setTextDraft({
                      ...textDraft,
                      profile: { ...textDraft.profile, tagline: event.target.value }
                    })
                  }
                  rows="4"
                />
              </label>
              <label>
                summary
                <textarea
                  value={textDraft.profile.summary || ""}
                  onChange={(event) =>
                    setTextDraft({
                      ...textDraft,
                      profile: { ...textDraft.profile, summary: event.target.value }
                    })
                  }
                  rows="4"
                />
              </label>
            </div>

            <div className="admin-form compact">
              <h3>Section Headings</h3>
              {Object.keys(defaultSections).map((field) => (
                <label key={field}>
                  {field}
                  <textarea
                    value={textDraft.sections[field] || ""}
                    onChange={(event) =>
                      setTextDraft({
                        ...textDraft,
                        sections: { ...textDraft.sections, [field]: event.target.value }
                      })
                    }
                    rows={field.toLowerCase().includes("description") || field.toLowerCase().includes("title") ? "3" : "1"}
                  />
                </label>
              ))}
            </div>

            <div className="admin-form compact">
              <h3>Lists</h3>
              <label>
                stats, one per line: value|label
                <textarea
                  value={textDraft.statsText}
                  onChange={(event) => setTextDraft({ ...textDraft, statsText: event.target.value })}
                  rows="5"
                />
              </label>
              <label>
                studio fit, one point per line
                <textarea
                  value={textDraft.studioFitText}
                  onChange={(event) => setTextDraft({ ...textDraft, studioFitText: event.target.value })}
                  rows="5"
                />
              </label>
              <label>
                tools, one per line
                <textarea
                  value={textDraft.toolsText}
                  onChange={(event) => setTextDraft({ ...textDraft, toolsText: event.target.value })}
                  rows="5"
                />
              </label>
              <label>
                capabilities, one per line: title|description
                <textarea
                  value={textDraft.capabilitiesText}
                  onChange={(event) => setTextDraft({ ...textDraft, capabilitiesText: event.target.value })}
                  rows="5"
                />
              </label>
              <label>
                process, one per line: title|detail
                <textarea
                  value={textDraft.processStepsText}
                  onChange={(event) => setTextDraft({ ...textDraft, processStepsText: event.target.value })}
                  rows="5"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Resume</h2>
            <a href={contentOverrides.resume?.url || baseEditorProfile.resume} target="_blank" rel="noreferrer">
              Current resume <ArrowUpRight size={16} />
            </a>
          </div>
          <article className="admin-project resume-row">
            <div className="admin-video-preview file-preview">
              <span>{contentOverrides.resume?.url ? "Cloudinary resume active" : "Original resume active"}</span>
            </div>
            <div className="admin-project-body">
              <label>
                Cloudinary resume URL
                <input
                  value={mediaInputs.resume}
                  onChange={(event) => setMediaInputs({ ...mediaInputs, resume: event.target.value })}
                  placeholder="https://res.cloudinary.com/.../upload/.../resume.pdf"
                />
              </label>
              <div className="admin-actions">
                <button className="button primary" type="button" onClick={saveResumeUrl}>
                  Save URL
                  <Save size={18} />
                </button>
                {contentOverrides.resume?.url && (
                  <button className="button secondary" type="button" onClick={removeResume}>
                    Restore original
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
            </div>
          </article>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Portrait Photos</h2>
          </div>
          <div className="admin-project-list">
            {portraitRows.map((portrait) => (
              <article className={portrait.isRemoved ? "admin-project removed" : "admin-project"} key={portrait.id}>
                <div className="admin-video-preview">
                  {portrait.isRemoved ? <span>Removed from site</span> : <img src={portrait.currentSrc} alt={portrait.alt} />}
                </div>
                <div className="admin-project-body">
                  <div>
                    <p>Photo</p>
                    <h2>{portrait.alt}</h2>
                  </div>
                  <label>
                    Cloudinary photo URL
                    <input
                      value={mediaInputs.portraits[portrait.id] || ""}
                      onChange={(event) =>
                        setMediaInputs({
                          ...mediaInputs,
                          portraits: { ...mediaInputs.portraits, [portrait.id]: event.target.value }
                        })
                      }
                      placeholder="https://res.cloudinary.com/.../image/upload/..."
                    />
                  </label>
                  <div className="admin-actions">
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => saveMediaUrl("portrait", portrait.id, mediaInputs.portraits[portrait.id])}
                    >
                      Save URL
                      <Save size={18} />
                    </button>
                    <button className="button secondary danger" type="button" onClick={() => removeMedia("portrait", portrait.id)}>
                      Remove
                      <Trash2 size={18} />
                    </button>
                    {portrait.hasOverride && (
                      <button className="button secondary" type="button" onClick={() => restoreMedia("portrait", portrait.id)}>
                        Restore
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Project Videos</h2>
          </div>
          <form className="admin-form compact new-project-form" onSubmit={createProject}>
            <h3>Add New Video</h3>
            <div className="admin-field-grid">
              <label>
                Title
                <input
                  value={newProject.title}
                  onChange={(event) => setNewProject({ ...newProject, title: event.target.value })}
                  required
                  placeholder="Wedding Highlight Film"
                />
              </label>
              <label>
                Category
                <input
                  value={newProject.type}
                  onChange={(event) => setNewProject({ ...newProject, type: event.target.value })}
                  placeholder="Wedding"
                />
              </label>
              <label>
                Filter name
                <input
                  value={newProject.discipline}
                  onChange={(event) => setNewProject({ ...newProject, discipline: event.target.value })}
                  placeholder="Wedding"
                />
              </label>
              <label>
                Year
                <input
                  value={newProject.year}
                  onChange={(event) => setNewProject({ ...newProject, year: event.target.value })}
                  placeholder="2026"
                />
              </label>
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={newProject.featured}
                onChange={(event) => setNewProject({ ...newProject, featured: event.target.checked })}
              />
              Show in All / Featured filter
            </label>
            <label>
              Short result text
              <textarea
                value={newProject.result}
                onChange={(event) => setNewProject({ ...newProject, result: event.target.value })}
                rows="3"
                placeholder="Delivered cinematic highlights and social-ready edits."
              />
            </label>
            <label>
              Description
              <textarea
                value={newProject.description}
                onChange={(event) => setNewProject({ ...newProject, description: event.target.value })}
                rows="3"
                placeholder="A polished edit with emotional storytelling and cinematic pacing."
              />
            </label>
            <div className="admin-field-grid">
              <label>
                Tags, comma separated
                <input
                  value={newProject.tags}
                  onChange={(event) => setNewProject({ ...newProject, tags: event.target.value })}
                  placeholder="Wedding, Cinematic, Reel"
                />
              </label>
              <label>
                Metrics, comma separated
                <input
                  value={newProject.metrics}
                  onChange={(event) => setNewProject({ ...newProject, metrics: event.target.value })}
                  placeholder="4K export, 60 sec reel"
                />
              </label>
            </div>
            <label>
              Cloudinary video URL
              <input
                value={newProject.video}
                onChange={(event) => setNewProject({ ...newProject, video: event.target.value })}
                placeholder="https://res.cloudinary.com/.../video.mp4"
              />
            </label>
            <button className="button primary" type="submit" disabled={isLoading}>
              Add video
              <Save size={18} />
            </button>
          </form>

        <div className="admin-project-list">
          {projectRows.map((project) => (
            <article className={project.isRemoved ? "admin-project removed" : "admin-project"} key={project.id}>
              <div className="admin-video-preview">
                {project.isRemoved ? (
                  <span>Removed from site</span>
                ) : (
                  <video src={project.currentVideo} muted loop playsInline preload="metadata" />
                )}
              </div>

              <div className="admin-project-body">
                <div>
                  <p>{project.type} / {project.year}</p>
                  <h2>{project.title}</h2>
                </div>
                <label>
                  Cloudinary video URL
                  <input
                    value={videoInputs[project.id] || ""}
                    onChange={(event) =>
                      setVideoInputs({ ...videoInputs, [project.id]: event.target.value })
                    }
                    placeholder="https://res.cloudinary.com/.../video.mp4"
                  />
                </label>
                <div className="admin-actions">
                  <button className="button primary" type="button" onClick={() => saveVideo(project.id)}>
                    Save
                    <Save size={18} />
                  </button>
                  <button className="button secondary danger" type="button" onClick={() => removeVideo(project.id)}>
                    Remove
                    <Trash2 size={18} />
                  </button>
                  {project.hasOverride && (
                    <button className="button secondary" type="button" onClick={() => restoreVideo(project.id)}>
                      Restore
                      <RotateCcw size={18} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {customProjectRows.map((project) => (
            <article className={project.isRemoved ? "admin-project removed" : "admin-project"} key={project.id}>
              <div className="admin-video-preview">
                {project.isRemoved || !project.currentVideo ? (
                  <span>{project.isRemoved ? "Removed from site" : "Paste a Cloudinary video URL"}</span>
                ) : (
                  <video src={project.currentVideo} muted loop playsInline preload="metadata" />
                )}
              </div>

              <div className="admin-project-body">
                <div>
                  <p>{project.type} / {project.year}</p>
                  <h2>{project.title}</h2>
                </div>
                <label>
                  Title
                  <input
                    value={project.title || ""}
                    onChange={(event) =>
                      setContentOverrides({
                        ...contentOverrides,
                        customProjects: {
                          ...contentOverrides.customProjects,
                          [project.id]: { ...project, title: event.target.value }
                        }
                      })
                    }
                  />
                </label>
                <label>
                  Cloudinary video URL
                  <input
                    value={project.video || ""}
                    onChange={(event) =>
                      setContentOverrides({
                        ...contentOverrides,
                        customProjects: {
                          ...contentOverrides.customProjects,
                          [project.id]: { ...project, video: event.target.value }
                        }
                      })
                    }
                  />
                </label>
                <div className="admin-actions">
                  <button className="button primary" type="button" onClick={() => updateCustomProject(contentOverrides.customProjects[project.id])}>
                    Save
                    <Save size={18} />
                  </button>
                  <button className="button secondary danger" type="button" onClick={() => deleteCustomProject(project.id)}>
                    Delete
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Sample Reel Videos</h2>
          </div>
          <div className="admin-project-list">
            {sampleRows.map((sample) => (
              <article className={sample.isRemoved ? "admin-project removed" : "admin-project"} key={sample.id}>
                <div className="admin-video-preview">
                  {sample.isRemoved ? (
                    <span>Removed from site</span>
                  ) : (
                    <video src={sample.currentSrc} muted loop playsInline preload="metadata" />
                  )}
                </div>
                <div className="admin-project-body">
                  <div>
                    <p>{sample.category}</p>
                    <h2>{sample.title}</h2>
                  </div>
                  <label>
                    Cloudinary sample video URL
                    <input
                      value={mediaInputs.samples[sample.id] || ""}
                      onChange={(event) =>
                        setMediaInputs({
                          ...mediaInputs,
                          samples: { ...mediaInputs.samples, [sample.id]: event.target.value }
                        })
                      }
                      placeholder="https://res.cloudinary.com/.../video/upload/..."
                    />
                  </label>
                  <div className="admin-actions">
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => saveMediaUrl("sample-video", sample.id, mediaInputs.samples[sample.id])}
                    >
                      Save URL
                      <Save size={18} />
                    </button>
                    <button className="button secondary danger" type="button" onClick={() => removeMedia("sample-video", sample.id)}>
                      Remove
                      <Trash2 size={18} />
                    </button>
                    {sample.hasOverride && (
                      <button className="button secondary" type="button" onClick={() => restoreMedia("sample-video", sample.id)}>
                        Restore
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function App() {
  const isAdminRoute = window.location.pathname.replace(/\/$/, "") === "/admin";
  const currentYear = new Date().getFullYear();
  const [portfolioData, setPortfolioData] = useState({
    projects: baseProjects,
    mediaSamples: baseMediaSamples,
    portraits: basePortraits,
    editorProfile: baseEditorProfile,
    sections: defaultSections,
    stats: baseStats,
    studioFit: baseStudioFit,
    capabilities,
    tools: baseTools,
    processSteps
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    projectType: "Studio role",
    message: ""
  });
  const [status, setStatus] = useState("idle");
  const [activeDiscipline, setActiveDiscipline] = useState("All");
  const [featuredIndex, setFeaturedIndex] = useState(0);

const [featuredMuted, setFeaturedMuted] = useState(true);
const featuredVideoRef = useRef(null);

  useEffect(() => {
    const loadContentOverrides = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/portfolio/content-overrides`);

        if (!response.ok) {
          throw new Error("Unable to load portfolio media");
        }

        const content = await response.json();
        setPortfolioData(applyContentOverrides(content));
      } catch {
        setPortfolioData({
          projects: baseProjects,
          mediaSamples: baseMediaSamples,
          portraits: basePortraits,
          editorProfile: baseEditorProfile,
          sections: defaultSections,
          stats: baseStats,
          studioFit: baseStudioFit,
          capabilities,
          tools: baseTools,
          processSteps
        });
      }
    };

    loadContentOverrides();
  }, []);
  const reelBars = useMemo(
    () => Array.from({ length: 24 }, (_, index) => 16 + ((index * 19) % 66)),
    []
  );

  const disciplines = ["All", "Engagement", "Wedding", "Reels", "Sangeet", "Haldi"];

  const filteredProjects = useMemo(() => {
    if (activeDiscipline === "All") {
      return portfolioData.projects.filter((project) => project.featured);
    }

    return portfolioData.projects.filter(
      (project) => project.discipline === activeDiscipline
    );
  }, [activeDiscipline, portfolioData.projects]);

  const featuredProject = filteredProjects[featuredIndex % filteredProjects.length] || portfolioData.projects[0];
  const {
    editorProfile,
    mediaSamples,
    portraits,
    sections,
    stats,
    studioFit,
    capabilities: portfolioCapabilities,
    tools,
    processSteps: portfolioProcessSteps
  } = portfolioData;

  const handleDisciplineChange = (discipline) => {
    setActiveDiscipline(discipline);
    setFeaturedIndex(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error("Unable to submit");
      }

      setStatus("sent");
      setForm({ name: "", email: "", projectType: "Studio role", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (isAdminRoute) {
    return <AdminDashboard />;
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sonu Kumar home">
          <img src="/sonu-kumar-logo.svg" alt="" width="36" height="36" />
          <span>Sonu Kumar</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#samples">Samples</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <img className="hero-media" src={heroImage} alt="Professional post-production editing suite" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">
            <Sparkles size={16} />
            {editorProfile.availability}
          </p>
          <h1>{editorProfile.name}</h1>
          <p className="hero-title">{editorProfile.title}</p>
          <p className="hero-copy">{editorProfile.tagline}</p>
          <div className="hero-actions">
            <a className="button primary" href="#work">
              Review portfolio <ArrowUpRight size={18} />
            </a>
            <a
            className="button secondary"
             href={editorProfile.resume}
             download>
             Download Resume
            </a>
            
            <a className="button secondary" href="#contact">
              Discuss a role <MessageCircle size={18} />
            </a>

            
          </div>
        </div>
        <aside className="edit-console" aria-label="Editing performance panel">
          <div className="console-top">
            <span>Studio Readiness</span>
            <span>4K</span>
          </div>
          <div className="preview-window">
            <MonitorPlay size={44} />
            <strong>Signature Wedding Film</strong>
          </div>
          <div className="timeline">
            {reelBars.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="console-meta">
            <span>Color Grading</span>
            <span>Audio Mix</span>
            <span>Motion Titles</span>
          </div>
        </aside>
      </section>

      <section className="stats-strip" aria-label="Portfolio highlights">
        {stats.map((item, index) => (
          <AnimatedStat
            key={item.label}
            value={item.value}
            label={item.label}
            index={index}
          />
        ))}
      </section>

      <section className="section intro-section">
        <div className="section-heading">
          <p className="eyebrow">{sections.positioningEyebrow}</p>
          <h2>{sections.positioningTitle}</h2>
        </div>
        <div className="intro-copy">
          <div className="portrait-strip" aria-label="Prince Yadav portraits">
            {portraits.map((portrait) => (
              <img key={portrait.src} src={portrait.src} alt={portrait.alt} />
            ))}
          </div>
          <p>{editorProfile.summary}</p>
          <div className="fit-list">
            {studioFit.map((item) => (
              <span key={item}>
                <BadgeCheck size={18} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="samples" className="section samples-section">
        <div className="section-heading">
          <p className="eyebrow">{sections.samplesEyebrow}</p>
          <h2>{sections.samplesTitle}</h2>
          <p>{sections.samplesDescription}</p>
        </div>
        <div className="sample-grid">
          {mediaSamples.map((sample, index) => (
            <ScrollVideo key={sample.src} sample={sample} index={index} />
          ))}
        </div>
      </section>

      <section id="work" className="section work-section">
        <div className="section-heading">
          <p className="eyebrow">{sections.workEyebrow}</p>
          <h2>{sections.workTitle}</h2>
        </div>

        <div className="filter-row" aria-label="Project filters">
          {disciplines.map((discipline) => (
            <button
              className={activeDiscipline === discipline ? "filter-chip active" : "filter-chip"}
              key={discipline}
              type="button"
              onClick={() => handleDisciplineChange(discipline)}
            >
              {discipline}
            </button>
          ))}
        </div>

       



        <div className="project-grid">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              isActive={project.title === featuredProject.title}
              onSelect={() => setFeaturedIndex(index)}
            />
          ))}
        </div>
      </section>

      <section id="capabilities" className="section capability-section">
        <div className="section-heading">
          <p className="eyebrow">{sections.capabilitiesEyebrow}</p>
          <h2>{sections.capabilitiesTitle}</h2>
        </div>
        <div className="capability-grid">
          {portfolioCapabilities.map((capability, index) => {
            const icons = [Camera, Clapperboard, Layers3, SlidersHorizontal];
            const Icon = icons[index] || Wand2;

            return (
              <article className="capability-card" key={capability.title}>
                <Icon size={24} />
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            );
          })}
        </div>

     <div className="tool-marquee" aria-label="Editing tools">
  {tools.map((tool) => (
    <span key={tool}>{tool}</span>
  ))}
</div>


      </section>

      <section id="process" className="section process-band">
        <div className="section-heading">
          <p className="eyebrow">{sections.processEyebrow}</p>
          <h2>{sections.processTitle}</h2>
        </div>
        <div className="process-grid">
          {portfolioProcessSteps.map((step, index) => (
            <div className="process-step" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </div>
          ))}
        </div>
      </section>


      <section id="contact" className="section contact-section">
        <div className="contact-copy">
          <p className="eyebrow">{sections.contactEyebrow}</p>
          <h2>{sections.contactTitle}</h2>
          <p>{sections.contactDescription}</p>
          <div className="contact-list">
            <a href={`mailto:${editorProfile.email}`}>
              <Mail size={18} />
              {editorProfile.email}
            </a>


            <a href={`tel:${editorProfile.phone.replace(/\s/g, "")}`}>
              <MessageCircle size={18} />
              {editorProfile.phone}
            </a>

            <a
            href={editorProfile.instagram}
            target="_blank"
            rel="noreferrer"
            >
           <Instagram size={18} />
           Instagram
           </a>

         <a
         href={editorProfile.whatsapp}
         target="_blank"
         rel="noreferrer"
        >
        <MessageCircle size={18} />
        WhatsApp
        </a>

        <span>
              <MapPin size={18} />
              {editorProfile.location}
        </span>



          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              placeholder="Your name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Requirement
            <select
              value={form.projectType}
              onChange={(event) => setForm({ ...form, projectType: event.target.value })}
            >
              {serviceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Message
            <textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              required
              rows="5"
              placeholder="Tell me about the role, project, deadline, or footage..."
            />
          </label>
          <button className="button primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send inquiry"}
            <ArrowUpRight size={18} />
          </button>
          {status === "sent" && <p className="form-status success">Inquiry sent successfully.</p>}
          {status === "error" && (
            <p className="form-status error">
 If you're experiencing issues submitting this form, please use the email or WhatsApp details provided on the left (for Desktop User) / on the Top (for Mobile User).
</p>
          )}
        </form>
      </section>

      <footer className="site-footer">
        <p>&copy; {currentYear} Sonu Kumar. All rights reserved.</p>
        <span>Wedding films, reels, photographs, and portfolio content are protected.</span>
      </footer>
    </main>
  );
}

export default App;
