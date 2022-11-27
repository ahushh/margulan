import { TgChannel } from '../models/TgChannel';
import dotenv from 'dotenv';
dotenv.config();

const apiId = +(process.env.TG_API_ID as string);
const apiHash = process.env.TG_API_HASH as string;
const session = process.env.TG_SESSION;

(async () => {
  console.warn('Rerun this script in case of connection error')
  const tg = new TgChannel(apiId, apiHash, session);
  await tg.connect();
  console.log('init-tg-session finished successfully')
  process.exit();
})();
