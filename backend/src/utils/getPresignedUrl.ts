import AWS from 'aws-sdk';

export const getPresignedUrl = async (key: string): Promise<string> => {
  const { BUCKET_NAME, BUCKET_ACCESS_KEY, BUCKET_SECRET_ACCESS_KEY, BUCKET_REGION } = process.env;

  AWS.config.update({
    accessKeyId: BUCKET_ACCESS_KEY,
    secretAccessKey: BUCKET_SECRET_ACCESS_KEY,
    region: BUCKET_REGION,
  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: BUCKET_NAME!,  //Non - null assertion operator
    Key: key,
    Expires: 60 * 5, // 5 minutes //30 sec
    ResponseContentDisposition: `attachment; filename="${key.split('/').pop()}"`,
  };

  return s3.getSignedUrlPromise('getObject', params);
};
