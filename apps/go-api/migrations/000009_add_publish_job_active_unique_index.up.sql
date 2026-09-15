CREATE UNIQUE INDEX "PublishJob_one_active_per_video"
ON "PublishJob" ("videoId")
WHERE "status" IN ('PENDING', 'RUNNING');