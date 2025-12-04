import { Transcription, ITranscription } from '../models/Transcription.model';

export interface CreateTranscriptionRequest {
  audioUrl: string;
  language?: string;
}

export interface CreateTranscriptionResponse {
  id: string;
  message: string;
}

export interface GetTranscriptionsResponse {
  transcriptions: ITranscription[];
  total: number;
  page: number;
  limit: number;
}

export class TranscriptionService {
  /**
   * Mock audio download - simulates downloading audio file
   */
  private async mockAudioDownload(audioUrl: string): Promise<void> {
    console.log(`🎵 Mocking audio download from: ${audioUrl}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate potential download failure (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Audio download failed - network timeout');
    }
    
    console.log('✅ Audio download completed successfully');
  }

  /**
   * Generate language-specific mock transcription text
   */
  private generateMockTranscription(language: string = 'en-US'): string {
    const mockTranscriptions: Record<string, string[]> = {
      'en-US': [
        "This is a sample transcription text.",
        "Hello, this is a test audio file being transcribed.",
        "The quick brown fox jumps over the lazy dog. This is a sample transcription.",
        "Welcome to the voice transcription service. Your audio has been processed successfully.",
        "This audio contains sample content for testing the transcription functionality."
      ],
      'fr-FR': [
        "Ceci est un exemple de texte de transcription.",
        "Bonjour, ceci est un fichier audio de test en cours de transcription.",
        "Le renard brun rapide saute par-dessus le chien paresseux. Ceci est un exemple de transcription.",
        "Bienvenue dans le service de transcription vocale. Votre audio a été traité avec succès.",
        "Cet audio contient un contenu d'exemple pour tester la fonctionnalité de transcription."
      ],
      'es-ES': [
        "Este es un texto de transcripción de muestra.",
        "Hola, este es un archivo de audio de prueba que se está transcribiendo.",
        "El zorro marrón rápido salta sobre el perro perezoso. Esta es una transcripción de muestra.",
        "Bienvenido al servicio de transcripción de voz. Su audio ha sido procesado exitosamente.",
        "Este audio contiene contenido de muestra para probar la funcionalidad de transcripción."
      ],
      'de-DE': [
        "Dies ist ein Beispiel-Transkriptionstext.",
        "Hallo, dies ist eine Test-Audiodatei, die transkribiert wird.",
        "Der schnelle braune Fuchs springt über den faulen Hund. Dies ist eine Beispieltranskription.",
        "Willkommen beim Sprachtranskriptionsdienst. Ihr Audio wurde erfolgreich verarbeitet.",
        "Dieses Audio enthält Beispielinhalte zum Testen der Transkriptionsfunktionalität."
      ],
      'it-IT': [
        "Questo è un testo di trascrizione di esempio.",
        "Ciao, questo è un file audio di test che viene trascritto.",
        "La volpe marrone veloce salta sopra il cane pigro. Questa è una trascrizione di esempio.",
        "Benvenuto nel servizio di trascrizione vocale. Il tuo audio è stato elaborato con successo.",
        "Questo audio contiene contenuti di esempio per testare la funzionalità di trascrizione."
      ],
      'pt-BR': [
        "Este é um texto de transcrição de exemplo.",
        "Olá, este é um arquivo de áudio de teste sendo transcrito.",
        "A raposa marrom rápida pula sobre o cão preguiçoso. Esta é uma transcrição de exemplo.",
        "Bem-vindo ao serviço de transcrição de voz. Seu áudio foi processado com sucesso.",
        "Este áudio contém conteúdo de exemplo para testar a funcionalidade de transcrição."
      ],
      'ja-JP': [
        "これはサンプルの転写テキストです。",
        "こんにちは、これは転写されているテストオーディオファイルです。",
        "素早い茶色のキツネが怠惰な犬の上を跳び越えます。これはサンプルの転写です。",
        "音声転写サービスへようこそ。あなたのオーディオは正常に処理されました。",
        "このオーディオには転写機能をテストするためのサンプルコンテンツが含まれています。"
      ],
      'ko-KR': [
        "이것은 샘플 전사 텍스트입니다.",
        "안녕하세요, 이것은 전사되고 있는 테스트 오디오 파일입니다.",
        "빠른 갈색 여우가 게으른 개를 뛰어넘습니다. 이것은 샘플 전사입니다.",
        "음성 전사 서비스에 오신 것을 환영합니다. 귀하의 오디오가 성공적으로 처리되었습니다.",
        "이 오디오에는 전사 기능을 테스트하기 위한 샘플 콘텐츠가 포함되어 있습니다."
      ],
      'zh-CN': [
        "这是一个示例转录文本。",
        "你好，这是一个正在被转录的测试音频文件。",
        "敏捷的棕色狐狸跳过懒惰的狗。这是一个示例转录。",
        "欢迎来到语音转录服务。您的音频已成功处理。",
        "此音频包含用于测试转录功能的示例内容。"
      ]
    };
    
    const transcriptions = mockTranscriptions[language] || mockTranscriptions['en-US'];
    return transcriptions[Math.floor(Math.random() * transcriptions.length)];
  }

  /**
   * Create a new transcription with mock processing and language support
   */
  async createTranscription(request: CreateTranscriptionRequest): Promise<CreateTranscriptionResponse> {
    try {
      // Step 1: Mock audio download
      await this.mockAudioDownload(request.audioUrl);
      
      // Get language or default to en-US
      const language = request.language || 'en-US';
      
      // Step 2: Generate language-specific mock transcription
      const transcriptionText = this.generateMockTranscription(language);
      console.log(`📝 Generated mock transcription (${language}):`, transcriptionText);
      
      // Step 3: Save to MongoDB with language
      const transcription = new Transcription({
        audioUrl: request.audioUrl,
        transcription: transcriptionText,
        source: 'mock',
        language: language,
        createdAt: new Date()
      });
      
      const savedTranscription = await transcription.save();
      console.log('💾 Transcription saved to MongoDB:', savedTranscription._id);
      
      return {
        id: savedTranscription._id.toString(),
        message: 'Transcription saved'
      };
      
    } catch (error) {
      console.error('❌ Error creating transcription:', error);
      throw error;
    }
  }

  /**
   * Get transcriptions from the last 30 days
   */
  async getRecentTranscriptions(page: number = 1, limit: number = 10): Promise<GetTranscriptionsResponse> {
    try {
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Build query for last 30 days
      const query = { 
        createdAt: { 
          $gte: thirtyDaysAgo 
        } 
      };
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination and sorting (most recent first)
      const [transcriptions, total] = await Promise.all([
        Transcription.find(query)
          .sort({ createdAt: -1 }) // Sort by most recent first
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
        Transcription.countDocuments(query)
      ]);
      
      console.log(`📊 Found ${transcriptions.length} transcriptions from last 30 days (page ${page})`);
      
      return {
        transcriptions: transcriptions as ITranscription[],
        total,
        page,
        limit
      };
      
    } catch (error) {
      console.error('❌ Error fetching recent transcriptions:', error);
      throw error;
    }
  }

  /**
   * Get transcription by ID
   */
  async getTranscriptionById(id: string): Promise<ITranscription | null> {
    try {
      const transcription = await Transcription.findById(id);
      return transcription;
    } catch (error) {
      console.error('❌ Error fetching transcription by ID:', error);
      throw error;
    }
  }
}
