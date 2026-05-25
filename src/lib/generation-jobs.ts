import { randomUUID } from "crypto";
import { generateWallpaperImage, type GenerateRequest } from "@/lib/image-generator";
import { addGeneratedRecord } from "@/lib/user-store";

export type GenerationJobStatus = "queued" | "running" | "succeeded" | "failed";

export type GenerationJob = {
  id: string;
  status: GenerationJobStatus;
  createdAt: number;
  updatedAt: number;
  input: GenerateRequest;
  result?: Awaited<ReturnType<typeof generateWallpaperImage>>;
  error?: string;
};

const maxJobAgeMs = 1000 * 60 * 45;

const globalForJobs = globalThis as typeof globalThis & {
  __baziWallpaperJobs?: Map<string, GenerationJob>;
};

const jobs = globalForJobs.__baziWallpaperJobs ?? new Map<string, GenerationJob>();
globalForJobs.__baziWallpaperJobs = jobs;

function cleanupJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > maxJobAgeMs) jobs.delete(id);
  }
}

async function runJob(id: string, input: GenerateRequest) {
  const runningJob = jobs.get(id);
  if (!runningJob) return;

  runningJob.status = "running";
  runningJob.updatedAt = Date.now();
  jobs.set(id, runningJob);

  try {
    const result = await generateWallpaperImage(input);
    if (input.userId && result.imageUrl) {
      await addGeneratedRecord(input.userId, {
        id: `${Date.now()}-${input.title || "wallpaper"}`,
        title: input.title || "今日壁纸",
        imageUrl: result.imageUrl,
        createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        visual: input.visual || "",
      });
    }
    jobs.set(id, {
      ...runningJob,
      status: "succeeded",
      updatedAt: Date.now(),
      result,
    });
  } catch (error) {
    jobs.set(id, {
      ...runningJob,
      status: "failed",
      updatedAt: Date.now(),
      error: error instanceof Error ? error.message : "图片生成暂时失败，请稍后再试。",
    });
  }
}

export function createGenerationJob(input: GenerateRequest) {
  cleanupJobs();
  const id = randomUUID();
  const job: GenerationJob = {
    id,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    input,
  };

  jobs.set(id, job);
  void runJob(id, input);
  return job;
}

export function getGenerationJob(id: string) {
  cleanupJobs();
  return jobs.get(id);
}

