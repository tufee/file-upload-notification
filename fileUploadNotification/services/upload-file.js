import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import busboy from 'busboy'

const processUpload = async event => {
  const s3 = new S3Client({ region: process.env.AWS_REGION })

  return new Promise((resolve, reject) => {
    const contentType =
      event.headers['content-type'] || event.headers['Content-Type']

    if (!contentType.startsWith('multipart/form-data')) {
      return {
        statusCode: 400,
        body: 'Invalid Content-Type header, expected multipart/form-data',
      }
    }

    const bb = busboy({ headers: { 'content-type': contentType } })

    bb.on('file', (_name, file, info) => {
      const { filename, _encoding, mimeType } = info
      const fileChunks = []

      file.on('data', data => {
        fileChunks.push(data)
      })

      file.on('end', async () => {
        const fileBuffer = Buffer.concat(fileChunks)

        const params = {
          Bucket: process.env.BucketName,
          Key: filename,
          Body: fileBuffer,
          ContentType: mimeType,
        }

        try {
          const command = new PutObjectCommand(params)
          const uploadResult = await s3.send(command)
          resolve(uploadResult)
        } catch (error) {
          reject(error)
        }
      })
    })

    bb.on('finish', () => {
      console.log('Upload finished.')
    })

    bb.write(event.body, event.isBase64Encoded ? 'base64' : 'binary')
    bb.end()
  })
}

export { processUpload }
