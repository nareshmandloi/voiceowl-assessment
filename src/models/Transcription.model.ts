import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscription extends Document {
  audioUrl: string;
  transcription: string;
  source?: 'mock' | 'azure';
  language?: string;
  workflowStatus?: 'transcription' | 'review' | 'approval' | 'completed' | 'rejected';
  workflowHistory?: Array<{
    status: string;
    timestamp: Date;
    comment?: string;
    reviewedBy?: string;
  }>;
  createdAt: Date;
  updatedAt?: Date;
}

const transcriptionSchema = new Schema<ITranscription>({
  audioUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(url: string) {
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        return urlRegex.test(url);
      },
      message: 'Invalid URL format'
    }
  },
  transcription: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['mock', 'azure'],
    default: 'mock'
  },
  language: {
    type: String,
    default: 'en-US',
    validate: {
      validator: function(lang: string) {
        // Support common language codes (e.g., en-US, fr-FR, es-ES, de-DE, it-IT, pt-BR, ja-JP, ko-KR, zh-CN)
        const langRegex = /^[a-z]{2}-[A-Z]{2}$/;
        return langRegex.test(lang);
      },
      message: 'Language must be in format xx-XX (e.g., en-US, fr-FR)'
    }
  },
  workflowStatus: {
    type: String,
    enum: ['transcription', 'review', 'approval', 'completed', 'rejected'],
    default: 'transcription'
  },
  workflowHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    comment: {
      type: String
    },
    reviewedBy: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Index for efficient querying
  },
  updatedAt: {
    type: Date
  }
});

// Compound index for efficient range queries on createdAt (descending order for recent first)
transcriptionSchema.index({ createdAt: -1 });

// Additional index for filtering by source and createdAt
transcriptionSchema.index({ source: 1, createdAt: -1 });

export const Transcription = mongoose.model<ITranscription>('Transcription', transcriptionSchema);
