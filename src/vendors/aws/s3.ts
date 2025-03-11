import S3, { GetObjectRequest } from 'aws-sdk/clients/s3'

import { ClientError } from '@helpers/errors/exception'

export interface FileData {
  buffer: Buffer
  key: string
  mimetype: string
}

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_BUCKET_ACCESS_KEY
const secretAccessKey = process.env.AWS_BUCKET_SECRET_KEY

if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing secrets')
}

const s3 = new S3({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})

const uploadMultipleFiles = (files: FileData[]) => {
  return Promise.allSettled(files.map((file) => uploadFile(file.buffer, file.key, file.mimetype)))
}

const uploadFile = async (buffer: Buffer, key: string, mimetype: string) => {
  const uploadParams = {
    Bucket: bucketName,
    Body: buffer,
    Key: key,
    ContentType: mimetype
  }

  return await s3.upload(uploadParams).promise()
}

const deleteFile = async (key: string) => {
  const uploadParams = {
    Bucket: bucketName,
    Key: key
  }

  return await s3.deleteObject(uploadParams).promise()
}

const getFile = async (key: string) => {
  try {
    const downloadParams: GetObjectRequest = {
      Key: key,
      Bucket: bucketName
    }

    const response = await s3.getObject(downloadParams).promise()

    if (!response) {
      throw new Error('Invalid data')
    }

    return response
  } catch (error) {
    if (error instanceof Error) {
      if (error.name == 'NoSuchKey') {
        throw new ClientError('invalid_path', 'Invalid path')
      } else {
        throw new Error('Invalid data')
      }
    } else {
      throw new Error('Invalid data')
    }
  }
}

export { uploadFile, uploadMultipleFiles, getFile, deleteFile }
