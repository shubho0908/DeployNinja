import { s3Client } from "@/lib/aws";
import { CopyObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function copyFolder(
    bucketName: string,
    sourcePrefix: string,
    targetPrefix: string
  ) {
    let isTruncated = true;
    let continuationToken: string | undefined;
  
    while (isTruncated) {
      const listParams = {
        Bucket: bucketName,
        Prefix: sourcePrefix,
        ContinuationToken: continuationToken,
      };
  
      const listedObjects = await s3Client.send(
        new ListObjectsV2Command(listParams)
      );
  
      if (listedObjects.Contents?.length) {
        // Copy each object with new prefix
        for (const object of listedObjects.Contents) {
          if (!object.Key) continue;
  
          const newKey = object.Key.replace(sourcePrefix, targetPrefix);
          await s3Client.send(
            new CopyObjectCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${object.Key}`,
              Key: newKey,
            })
          );
        }
  
        // Delete old objects
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listedObjects.Contents.map((item) => ({
              Key: item.Key,
            })),
          },
        };
        await s3Client.send(new DeleteObjectsCommand(deleteParams));
      }
  
      isTruncated = listedObjects.IsTruncated || false;
      continuationToken = listedObjects.NextContinuationToken;
    }
  }
  

export async function deleteFolder(bucketName: string, prefix: string) {
    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
      const listParams: any = {
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      };
      const listedObjects = await s3Client.send(
        new ListObjectsV2Command(listParams)
      );

      if (listedObjects.Contents?.length) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listedObjects.Contents.map((item) => ({
              Key: item.Key,
            })),
          },
        };
        await s3Client.send(new DeleteObjectsCommand(deleteParams));
      }

      isTruncated = listedObjects.IsTruncated || false;
      continuationToken = listedObjects.NextContinuationToken;
    }
  }