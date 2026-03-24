import vine from '@vinejs/vine'

/**
 * Validates the signature analysis request
 */
export const signatureAnalysisValidator = vine.compile(
  vine.object({
    signature: vine.file({
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    }),
  })
)
