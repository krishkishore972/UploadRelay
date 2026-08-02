import { Queue } from "bullmq";


export type TranscodeJobData = {
    sourceKey: string;
}

export const transcodeQueue = new Queue<TranscodeJobData>("transcode-video",{
    connection:{
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379),
    }
})

export async function addTranscodeJob(data : TranscodeJobData){
    return transcodeQueue.add("create-preview", data,{
        attempts: 3,
        backoff: {
        type: "exponential",
        delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    });
}