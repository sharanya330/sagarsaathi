import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let s3 = null;
const getS3 = () => {
  if (s3) return s3;
  if (!process.env.AWS_S3_BUCKET) return null;
  s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1', credentials: process.env.AWS_ACCESS_KEY_ID ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } : undefined });
  return s3;
};

export const uploadBufferToS3 = async (buffer, key, contentType) => {
  const client = getS3();
  if (!client) return null;
  const bucket = process.env.AWS_S3_BUCKET;
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType, ACL: 'public-read' });
  await client.send(cmd);
  const base = process.env.AWS_S3_PUBLIC_BASE || `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`;
  return `${base}/${key}`;
};
