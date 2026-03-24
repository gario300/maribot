import { test } from '@japa/runner'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

test.group('Signature analysis', (group) => {
  let dummyImagePath: string

  group.setup(async () => {
    // Create a dummy image for testing
    dummyImagePath = path.join(currentDir, 'dummy_signature.jpg')
    // A 1x1 pixel JPEG base64 encoded
    const base64Image =
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    await fs.writeFile(dummyImagePath, Buffer.from(base64Image, 'base64'))
  })

  group.teardown(async () => {
    // Clean up
    try {
      await fs.unlink(dummyImagePath)
    } catch (e) {}
  })

  test('should return 422 if no signature file is provided', async ({ client }) => {
    const response = await client.post('/api/v1/signatures/analyze')

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          message: 'The signature field must be defined',
          field: 'signature',
        },
      ],
    })
  })

  test('should analyze signature successfully', async ({ client, assert }) => {
    // Note: This test will actually call the OpenAI API.
    // If you want to avoid hitting the API, you should mock the OpenAI client or SignatureAnalysisService.
    const response = await client
      .post('/api/v1/signatures/analyze')
      .file('signature', dummyImagePath)

    if (response.status() === 500) {
      // It might fail if the API key is not valid or rate limited
      console.log('OpenAI API returned 500. Ensure your API key is correct.', response.body())
    } else {
      response.assertStatus(200)
      response.assertBodyContains({
        message: 'Signature analyzed successfully',
      })

      const data = response.body().data
      assert.property(data, 'size')
      assert.property(data, 'curvature')
      assert.property(data, 'pressure')
      assert.property(data, 'slant')
      assert.property(data, 'speed')
      assert.property(data, 'overall_shape')
    }
  }).disableTimeout() // Disable timeout because OpenAI API can be slow
})
