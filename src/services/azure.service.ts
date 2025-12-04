import { config } from '../config/env';
import { Transcription, ITranscription } from '../models/Transcription.model';

export interface AzureTranscriptionRequest {
  audioUrl: string;
  language?: string;
}

export interface AzureTranscriptionResponse {
  id: string;
  message: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

export class AzureService {
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000   // 8 seconds
  };

  /**
   * Generate language-specific mock transcriptions
   */
  private getLanguageSpecificTranscriptions(language: string): string[] {
    const transcriptions: Record<string, string[]> = {
      'en-US': [
        "This audio has been transcribed using Azure Speech Services.",
        "Azure Cognitive Services successfully processed this audio content.",
        "Voice recognition completed using Microsoft Azure Speech-to-Text API.",
        "Azure Speech Service has converted this audio to text with high accuracy.",
        "Microsoft Azure provided this transcription with confidence score: 0.95"
      ],
      'fr-FR': [
        "Cet audio a été transcrit en utilisant les services de reconnaissance vocale Azure.",
        "Azure Cognitive Services a traité avec succès ce contenu audio.",
        "La reconnaissance vocale a été complétée en utilisant l'API Speech-to-Text de Microsoft Azure.",
        "Le service Azure Speech a converti cet audio en texte avec une grande précision.",
        "Microsoft Azure a fourni cette transcription avec un score de confiance de 0.95"
      ],
      'es-ES': [
        "Este audio ha sido transcrito usando los servicios de voz de Azure.",
        "Azure Cognitive Services procesó exitosamente este contenido de audio.",
        "El reconocimiento de voz se completó usando la API Speech-to-Text de Microsoft Azure.",
        "El servicio Azure Speech ha convertido este audio a texto con alta precisión.",
        "Microsoft Azure proporcionó esta transcripción con un puntaje de confianza de 0.95"
      ],
      'de-DE': [
        "Diese Audio wurde mit Azure Speech Services transkribiert.",
        "Azure Cognitive Services hat diesen Audioinhalt erfolgreich verarbeitet.",
        "Die Spracherkennung wurde mit der Microsoft Azure Speech-to-Text API abgeschlossen.",
        "Der Azure Speech Service hat dieses Audio mit hoher Genauigkeit in Text umgewandelt.",
        "Microsoft Azure stellte diese Transkription mit einem Konfidenzwert von 0.95 bereit"
      ],
      'it-IT': [
        "Questo audio è stato trascritto utilizzando i servizi di riconoscimento vocale di Azure.",
        "Azure Cognitive Services ha elaborato con successo questo contenuto audio.",
        "Il riconoscimento vocale è stato completato utilizzando l'API Speech-to-Text di Microsoft Azure.",
        "Il servizio Azure Speech ha convertito questo audio in testo con alta precisione.",
        "Microsoft Azure ha fornito questa trascrizione con un punteggio di confidenza di 0.95"
      ],
      'pt-BR': [
        "Este áudio foi transcrito usando os serviços de fala do Azure.",
        "Os Serviços Cognitivos do Azure processaram com sucesso este conteúdo de áudio.",
        "O reconhecimento de voz foi concluído usando a API Speech-to-Text do Microsoft Azure.",
        "O serviço Azure Speech converteu este áudio em texto com alta precisão.",
        "A Microsoft Azure forneceu esta transcrição com uma pontuação de confiança de 0.95"
      ],
      'ja-JP': [
        "このオーディオはAzure音声サービスを使用して転写されました。",
        "Azure Cognitive Servicesがこのオーディオコンテンツを正常に処理しました。",
        "Microsoft Azure Speech-to-Text APIを使用して音声認識が完了しました。",
        "Azure音声サービスがこのオーディオを高精度でテキストに変換しました。",
        "Microsoft Azureが信頼度スコア0.95でこの転写を提供しました"
      ],
      'ko-KR': [
        "이 오디오는 Azure 음성 서비스를 사용하여 전사되었습니다.",
        "Azure Cognitive Services가 이 오디오 콘텐츠를 성공적으로 처리했습니다.",
        "Microsoft Azure Speech-to-Text API를 사용하여 음성 인식이 완료되었습니다.",
        "Azure Speech Service가 이 오디오를 높은 정확도로 텍스트로 변환했습니다.",
        "Microsoft Azure가 0.95의 신뢰도 점수로 이 전사를 제공했습니다"
      ],
      'zh-CN': [
        "此音频已使用Azure语音服务进行转录。",
        "Azure认知服务已成功处理此音频内容。",
        "使用Microsoft Azure语音转文本API完成了语音识别。",
        "Azure语音服务已高精度地将此音频转换为文本。",
        "Microsoft Azure提供了此转录，置信度得分为0.95"
      ]
    };
    
    return transcriptions[language] || transcriptions['en-US'];
  }

  /**
   * Mock Azure Speech Service call with retry logic and language support
   */
  private async callAzureSpeechService(audioUrl: string, language: string = 'en-US', attempt: number = 1): Promise<string> {
    console.log(`🔵 Azure Speech API call attempt ${attempt} for: ${audioUrl} (language: ${language})`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate Azure API failures (30% chance for demonstration)
    const failureRate = 0.3;
    if (Math.random() < failureRate) {
      throw new Error(`Azure Speech API error: Service temporarily unavailable (attempt ${attempt})`);
    }
    
    // Get language-specific transcriptions
    const languageTranscriptions = this.getLanguageSpecificTranscriptions(language);
    const transcription = languageTranscriptions[Math.floor(Math.random() * languageTranscriptions.length)];
    
    console.log(`🎯 Azure Speech API response received (${language})`);
    return transcription;
  }

  /**
   * Exponential backoff delay calculation
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️  ${context} failed on attempt ${attempt}:`, lastError.message);
        
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }
        
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Validate Azure configuration
   */
  private validateAzureConfig(): void {
    if (!config.AZURE_SPEECH_KEY || config.AZURE_SPEECH_KEY === 'mock-azure-key') {
      console.warn('⚠️  Using mock Azure configuration. Set AZURE_SPEECH_KEY for production.');
    }
    
    if (!config.AZURE_REGION) {
      throw new Error('AZURE_REGION is required for Azure Speech Service');
    }
  }

  /**
   * Mock audio download for Azure processing
   */
  private async downloadAudioForAzure(audioUrl: string): Promise<void> {
    console.log(`📥 Downloading audio for Azure processing: ${audioUrl}`);
    
    // Simulate download with potential failure
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (Math.random() < 0.1) {
      throw new Error('Failed to download audio for Azure processing');
    }
    
    console.log('✅ Audio downloaded successfully for Azure processing');
  }

  /**
   * Create transcription using Azure Speech Service (mocked)
   */
  async createAzureTranscription(request: AzureTranscriptionRequest): Promise<AzureTranscriptionResponse> {
    try {
      console.log('🚀 Starting Azure transcription process...');
      
      // Validate Azure configuration
      this.validateAzureConfig();
      
      // Download audio
      await this.downloadAudioForAzure(request.audioUrl);
      
      // Get language or default to en-US
      const language = request.language || 'en-US';
      
      // Call Azure Speech Service with retry logic and language support
      const transcriptionText = await this.withRetry(
        () => this.callAzureSpeechService(request.audioUrl, language),
        'Azure Speech Service call'
      );
      
      console.log('📝 Azure transcription completed:', transcriptionText);
      
      // Save to MongoDB with Azure source and language
      const transcription = new Transcription({
        audioUrl: request.audioUrl,
        transcription: transcriptionText,
        source: 'azure',
        language: language,
        createdAt: new Date()
      });
      
      const savedTranscription = await transcription.save();
      console.log('💾 Azure transcription saved to MongoDB:', savedTranscription._id);
      
      return {
        id: savedTranscription._id.toString(),
        message: 'Transcription saved'
      };
      
    } catch (error) {
      console.error('❌ Azure transcription failed:', error);
      
      // Graceful fallback to mock transcription
      return this.fallbackToMockTranscription(request);
    }
  }

  /**
   * Fallback to mock transcription if Azure fails
   */
  private async fallbackToMockTranscription(request: AzureTranscriptionRequest): Promise<AzureTranscriptionResponse> {
    try {
      console.log('🔄 Falling back to mock transcription...');
      
      const language = request.language || 'en-US';
      const mockTranscription = "This is a fallback transcription generated when Azure Speech Service is unavailable.";
      
      const transcription = new Transcription({
        audioUrl: request.audioUrl,
        transcription: mockTranscription,
        source: 'mock', // Mark as mock since Azure failed
        language: language,
        createdAt: new Date()
      });
      
      const savedTranscription = await transcription.save();
      console.log('💾 Fallback transcription saved to MongoDB:', savedTranscription._id);
      
      return {
        id: savedTranscription._id.toString(),
        message: 'Transcription saved (fallback mode)'
      };
      
    } catch (fallbackError) {
      console.error('❌ Fallback transcription also failed:', fallbackError);
      throw new Error('Both Azure and fallback transcription failed');
    }
  }

  /**
   * Get Azure service health status
   */
  async getAzureServiceHealth(): Promise<{ status: string; region: string; timestamp: Date }> {
    try {
      // Mock health check
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        status: Math.random() > 0.1 ? 'healthy' : 'degraded',
        region: config.AZURE_REGION,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        region: config.AZURE_REGION,
        timestamp: new Date()
      };
    }
  }
}
