// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Weaviate } from '../../core/Weaviate';
const weaviateHost = process.env.WEAVIATE_HOST as string;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    const id = req.query.id as string;
    const channel = req.query.channel as string;
    const distance = req.query.distance ? +req.query.distance : undefined;
    const certainty = req.query.certainty ? +req.query.certainty : undefined;
    const w = new Weaviate(weaviateHost);
    const messages = await w.getRelevantMessagesById(channel, id, distance, certainty);
    res.status(200).json({ messages })
  } catch (e) {
    console.log(e);
    res.status(500).json(e as any);
  }
}

