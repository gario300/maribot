import fs from 'node:fs/promises'
import { GoogleGenerativeAI } from '@google/generative-ai'
import env from '#start/env'

export default class SignatureAnalysisService {
  private genAI: GoogleGenerativeAI

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.get('GEMINI_API_KEY'))
  }

  /**
   * Analyzes a signature image using Google Gemini
   * @param tmpPath Path to the temporary image file
   * @returns Detailed physical characteristics of the signature
   */
  async analyzeSignature(tmpPath: string) {
    // Read the file from the temporary path and convert to base64
    const fileBuffer = await fs.readFile(tmpPath)
    const base64Image = fileBuffer.toString('base64')

    const prompt = `
Eres un experto analista de caligrafía. Analiza la imagen de la firma proporcionada y describe EXCLUSIVAMENTE sus características físicas en detalle. No incluyas análisis de personalidad ni grafológico.
Devuelve un objeto JSON con la siguiente estructura exacta:
{
  "size": "Descripción del tamaño de la firma en relación al espacio",
  "curvature": "Descripción del tipo de curvas (angulosas, redondeadas, etc.)",
  "pressure": "Estimación visual de la presión del trazo (fuerte, media, ligera)",
  "slant": "Inclinación de la escritura (hacia la derecha, izquierda, vertical)",
  "speed": "Estimación de la velocidad del trazo (rápida/fluida, lenta/temblorosa)",
  "overall_shape": "Descripción general de la forma (legible, abstracta, lineal, condensada)"
}
    `

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error('Failed to analyze signature')
    }

    return JSON.parse(responseText)
  }
}
