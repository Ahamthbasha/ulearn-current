import AWS from 'aws-sdk'
import { S3BucketErrors } from './constants'

export interface IMulterFile {
  originalname: string,
  buffer: Buffer,
  mimetype: string
}

export async function uploadToS3Bucket(file: IMulterFile, folderName: string): Promise<string> {
  try {
    if (!file) {
      throw new Error(S3BucketErrors.NO_FILE);
    }

    if (!process.env.BUCKET_NAME || !process.env.BUCKET_ACCESS_KEY || !process.env.BUCKET_SECRET_ACCESS_KEY || !process.env.BUCKET_REGION) {
      throw new Error(S3BucketErrors.BUCKET_REQUIREMENT_MISSING);
    }

    const normalizedFolder = folderName.replace(/\/$/, ''); // ✅ Remove trailing slash

    const params: any = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${normalizedFolder}/${Date.now()}_${file.originalname}`, // ✅ Correct Key
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    AWS.config.update({
      accessKeyId: process.env.BUCKET_ACCESS_KEY,
      secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
      region: process.env.BUCKET_REGION
    });

    const s3 = new AWS.S3();

    const uploadedResult = await s3.upload(params).promise();

    if (!uploadedResult || !uploadedResult.Location) {
      throw new Error(S3BucketErrors.ERROR_GETTING_IMAGE);
    }

    return uploadedResult.Key;
  } catch (error: any) {
    console.error('s3 upload failed', error.message);
    throw error;
  }
}
