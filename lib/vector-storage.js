/**
 * WAVELENGTH Vector Storage - Pinecone Integration
 * Uses environment variables for secure API key management
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export default class WavelengthVectorStorage {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.openai = null;
    this.indexName = 'wavelength-lore';
    this.dimension = 1536; // OpenAI text-embedding-3-small
  }

  async initialize() {
    try {
      // Initialize Pinecone
      if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY environment variable required');
      }
      
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });

      this.index = this.pinecone.index(this.indexName);

      // Initialize OpenAI
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable required');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      return { success: true, message: 'Vector storage initialized' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async storeKnowledge(knowledge) {
    try {
      const embedding = await this.generateEmbedding(knowledge.content);
      
      await this.index.upsert([{
        id: knowledge.id,
        values: embedding,
        metadata: {
          type: knowledge.type,
          content: knowledge.content,
          tags: knowledge.tags,
          context: knowledge.context,
          timestamp: knowledge.timestamp
        }
      }]);

      return { success: true, id: knowledge.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchKnowledge(query, options = {}) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchResult = await this.index.query({
        vector: queryEmbedding,
        topK: options.limit || 5,
        includeMetadata: true,
        filter: options.type ? { type: { $eq: options.type } } : undefined
      });

      const results = searchResult.matches.map(match => ({
        id: match.id,
        score: match.score,
        content: match.metadata.content,
        type: match.metadata.type,
        tags: match.metadata.tags,
        context: match.metadata.context,
        timestamp: match.metadata.timestamp
      }));

      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateEmbedding(text) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    
    return response.data[0].embedding;
  }

  async getStats() {
    try {
      const stats = await this.index.describeIndexStats();
      return { 
        success: true, 
        stats: {
          total_vectors: stats.totalVectorCount,
          dimension: stats.dimension,
          index_fullness: stats.indexFullness
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}