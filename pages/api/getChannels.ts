// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { IChannel } from '../../interfaces/Channel';
import { Weaviate } from '../../core/Weaviate';
const weaviateHost = process.env.WEAVIATE_HOST;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ channels: IChannel[] }>
) {
  try {
    const w = new Weaviate(weaviateHost as string);
    const { data } = await w.getAllChannels();
    res.status(200).json({ channels: data.Get.Channel })
  } catch (e) {
    res.status(500).json(e as any);
  }
}