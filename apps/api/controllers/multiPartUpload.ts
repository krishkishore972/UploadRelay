import { json, type Request, type Response } from "express";

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// controllers/multiPartUpload.ts

const s3 = new S3Client({
    region:process.env.AWS_REGION,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const bucketName = process.env.S3_BUCKET_NAME!;


/*
{
  fileName: videoFile.name,
  fileType: videoFile.type,
  fileSize: videoFile.size
  ------
  {
  uploadId: "...",
  key: "uploads/1730000000-video.mp4"
}
}
*/

export async function createMultipartUpload(req:Request, res: Response){
    try {
        const {fileName, fileType} = req.body;

        if (!fileName || !fileType) {
          return res.status(400).json({
          error: "fileName and fileType are required",
        });
    }

    if (!fileType.startsWith("video/")) {
      return res.status(400).json({
        error: "Only video files are allowed",
      });
    }

    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType
    })

    const result = await s3.send(command);

    return res.json({
        uploadId: result.UploadId,
        key,
    })
    } catch (error) {
        return res.status(500).json({
      error: "Failed to create multipart upload",
    });
    }
}

export async function signSingleUploadPart(req:Request,res:Response){
  try {
    const {key,uploadId,partNumber} = req.body;
    if (!key || !uploadId || !partNumber) {
        return res.status(400).json({
          err:"key, uploadId, and partNumber are required"
        })
    }

    const command = new UploadPartCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key:key,
      UploadId:uploadId,
      PartNumber:Number(partNumber),
    })
    const signedUrl = await getSignedUrl(s3,command,{
      expiresIn: 60 * 10 // 10 min
    })
    return res.json({
      signedUrl,
      partNumber:Number(partNumber)
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failed to sign upload part",
    });
  }
}

export async function completeMultipartUpload(req:Request,res:Response) {
  try {
    const {key,uploadId,parts} = req.body;
    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({
        error:"Key,uploadId and parts are required",
      });
    }

    const sortedParts = parts.map((part) => ({
      PartNumber:Number(part.PartNumber),
      ETag:part.ETag
    }))
    .sort((a,b) => a.PartNumber-b.PartNumber);

    console.log("Completing multipart upload with parts:", sortedParts);

  if (sortedParts.some((part) => !part.PartNumber || !part.ETag)) {
    return res.status(400).json({
      error: "Each part must include PartNumber and ETag",
      parts: sortedParts,
    });
  }


    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    })

    const result = await s3.send(command);
    return res.json({
      message: "Upload completed",
      location: result.Location,
      key: result.Key,
      bucket: result.Bucket,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to complete multipart upload",
    });
  }
}




