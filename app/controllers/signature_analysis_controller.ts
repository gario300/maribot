import type { HttpContext } from '@adonisjs/core/http'
import { signatureAnalysisValidator } from '#validators/signature_validator'
import SignatureAnalysisService from '#services/signature_analysis_service'

export default class SignatureAnalysisController {
  private signatureAnalysisService: SignatureAnalysisService

  constructor() {
    this.signatureAnalysisService = new SignatureAnalysisService()
  }

  async analyze({ request, response }: HttpContext) {
    // Validate request
    const payload = await request.validateUsing(signatureAnalysisValidator)

    const file = payload.signature

    // Check if the temporary path is available
    if (!file.tmpPath) {
      return response.badRequest({ message: 'Unable to process the uploaded file.' })
    }

    try {
      // Analyze the signature
      const analysis = await this.signatureAnalysisService.analyzeSignature(file.tmpPath)

      return response.ok({
        message: 'Signature analyzed successfully',
        data: analysis,
      })
    } catch (error) {
      console.error('Signature analysis failed:', error)
      return response.internalServerError({
        message: 'An error occurred during signature analysis.',
        error: error.message,
      })
    }
  }
}
