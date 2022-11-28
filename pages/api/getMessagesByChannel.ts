// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Weaviate } from '../../core/Weaviate';
const weaviateHost = process.env.WEAVIATE_HOST;

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    const channelName = req.query.channel as string;

    const w = new Weaviate(weaviateHost as string);
    const messages = await w.getMessages(channelName);
    res.status(200).json({ messages });
  } catch (e) {
    res.status(500).json(e as any);
  }
}

