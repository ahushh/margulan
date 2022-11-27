// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Cohere } from '../../models/Cohere';
import { TgChannel } from '../../models/TgChannel';
import { Weaviate } from '../../models/Weaviate';


const apiId = +(process.env.TG_API_ID as string);
const apiHash = process.env.TG_API_HASH as string;
const session = process.env.TG_SESSION as string;
const IS_COHERE_TRIAL = process.env.IS_COHERE_TRIAL === 'true';
const cohereApiKey = process.env.COHERE_API_KEY as string;
const weaviateHost = process.env.WEAVIATE_HOST as string;

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const channel = req.query.channel as string;

    const tg = new TgChannel(apiId, apiHash, session);
    await tg.connect();
    const messages = await tg.fetchMessages(channel);
    const cohere = new Cohere(cohereApiKey, IS_COHERE_TRIAL);
    const messagesWithEmbeddings = await cohere.getMessagesWithEmbeddings(messages);
    const w = new Weaviate(weaviateHost);
    // await w.createSchema();
    await w.importChannelWithMessages(channel, messagesWithEmbeddings);
    res.status(200).json({ status: 'ok' })
  } catch (e) {
    res.status(500).json(e as any);
  }
}

