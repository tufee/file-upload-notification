import { processUpload } from './services/upload-file.js'

const handler = async event => {
  try {
    const result = await processUpload(event)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'file upload successful',
        s3Url: result.Location,
      }),
    }
  } catch (error) {
    console.error('Erro:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error uploading file',
        error: error.message,
      }),
    }
  }
}

export { handler }
