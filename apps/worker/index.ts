import { Worker } from "bullmq";
import { transcodeVideo } from "./services/transcodeVideo";

type TranscodeJobData = {
  sourceKey: string;
};

const worker = new Worker<TranscodeJobData>("transcode-video", 

    async (job) => {
        console.log("Processing transcode job:", job.id);
        console.log("Source key:", job.data.sourceKey);
        await transcodeVideo({
             sourceKey: job.data.sourceKey,
        });
        console.log("Transcode job completed:", job.id);
    },
    {
        connection : {
            host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379),
        }
    }

)

worker.on("failed", (job, error) => {
  console.error("Transcode job failed:", job?.id, error);
});

worker.on("completed", (job) => {
  console.log("Transcode job done:", job.id);
});

console.log("Transcode worker is running");



