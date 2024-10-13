import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import busboy from 'busboy'

const contentTypeToLowerCase = request => {
  if (request.headers['Content-Type']) {
    const contentTypeValue = request.headers['Content-Type']
    request.headers['content-type'] = contentTypeValue
    return request
  }
}

const processUpload = async event => {
  const s3 = new S3Client({ region: process.env.AWS_REGION })

  return new Promise((resolve, reject) => {
    const parsedEvent = contentTypeToLowerCase(event)
    const bb = busboy({ headers: parsedEvent.headers['content-type'] })

    bb.on('file', (_name, file, info) => {
      const { filename, mimetype } = info
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
          ContentType: mimetype,
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
