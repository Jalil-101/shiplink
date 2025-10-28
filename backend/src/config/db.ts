import mongoose from 'mongoose';
import dotenv from 'dotenv';
import type { env_types } from '../types/env.js';

dotenv.config();

const mongo_uri: env_types['MONGO_URI'] = process.env.MONGO_URI || 'mongodb://localhost:27017/shiplink';

export const connect_db = async () => {
  try {
    await mongoose.connect(mongo_uri);
    console.log('mongodb active');
  } catch (error) {
    console.error('mongodb error:', error);
    process.exit(1);
  }
}