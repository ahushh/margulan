import { Weaviate } from '../models/Weaviate';
import dotenv from 'dotenv';
dotenv.config();

const weaviateHost = process.env.WEAVIATE_HOST as string;

(async () => {
  const w = new Weaviate(weaviateHost);
  await w.createSchema();
  console.log('init-db-scheme finished successfully')
  process.exit();
})();
