// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Cohere } from '../../core/Cohere';
import { Weaviate } from '../../core/Weaviate';

const IS_COHERE_TRIAL = process.env.IS_COHERE_TRIAL === 'true';
const cohereApiKey = process.env.COHERE_API_KEY as string;
const weaviateHost = process.env.WEAVIATE_HOST as string;

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {

    const query = req.query.query as string;
    const channel = req.query.channel as string;
    const distance = req.query.distance ? +req.query.distance : undefined;
    const certainty = req.query.certainty ? +req.query.certainty : undefined;
    const cohere = new Cohere(cohereApiKey, IS_COHERE_TRIAL);
    const w = new Weaviate(weaviateHost);

    const vector = await cohere.getEmbedding(query);
    const messages = await w.search(channel, vector as any[], distance, certainty);
    res.status(200).json({ messages })
  } catch (e) {
    res.status(500).json(e as any);
  }
}

