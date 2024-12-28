import { s3Client } from "@/lib/aws";
import { CopyObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * Copies all objects from a source prefix to a target prefix within the same S3 bucket.
 * 
 * This function lists objects under the specified `sourcePrefix` in the given `bucketName`,
 * and copies each object to a new location under the `targetPrefix`. After copying, the 
 * original objects under the `sourcePrefix` are deleted. This process is repeated in a loop 
 * until all objects are processed, handling paginated results with the `ContinuationToken`.
 * 
 * @param bucketName - The name of the S3 bucket containing the objects to copy.
 * @param sourcePrefix - The prefix within the bucket of the objects to copy from.
 * @param targetPrefix - The prefix within the bucket to copy the objects to.
 */

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
  

  /**
   * Deletes all objects within the specified `prefix` from the given `bucketName`.
   * 
   * This function lists objects under the specified `prefix` in the given `bucketName`,
   * and deletes each object. This process is repeated in a loop until all objects are
   * processed, handling paginated results with the `ContinuationToken`.
   * 
   * @param bucketName - The name of the S3 bucket containing the objects to delete.
   * @param prefix - The prefix within the bucket of the objects to delete.
   */
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