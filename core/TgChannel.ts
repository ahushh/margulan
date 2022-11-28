const { pick } = require('lodash/fp');
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
const input = require('input');
import fs from 'fs';

export class TgChannel {
  static CACHE_PATH = 'cache/messages.json';

  static saveTelegramSession(session: string) {
    const data = fs.readFileSync('.env', 'utf-8');
    const newData = data.replace(/^TG_SESSION=.*$/gm, `TG_SESSION=${session}`);
    fs.writeFileSync('.env', newData, 'utf-8');

    console.log('Session saved to .env');
  }

  public session: StringSession;
  public client: TelegramClient;

  constructor(public apiId: number, public apiHash: string, public sessionValue?: string) {
    this.session = new StringSession(sessionValue || '');
    this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
      connectionRetries: 2,
    });
  }

  async connect() {
    await this.client.start({
      phoneNumber: async () => input.text('Please enter your number: '),
      password: async () => input.text('Please enter your password: '),
      phoneCode: async () => input.text('Please enter the code you received: '),
      onError: (err) => { throw new Error(err as any) }
    });
    console.log('Connected to telegram');
    this.client = this.client;
    if (!this.sessionValue) {
      TgChannel.saveTelegramSession(this.client.session.save() as unknown as string);
    } else {
      console.log('Session is already saved in .env')
    }
  }

  async fetchMessages(channelId: string) {
    console.log('Fetching messages...');
    const { chats: [channel] } = await this.client.invoke(
      new Api.channels.GetChannels({
        id: [channelId],
      }),
    );
    // console.log('channel', JSON.stringify(channel, null, 2));

    const messages = await this.client.getMessages(channel);
    // console.log('messages', JSON.stringify(messages.slice(0, 10), null, 2));
    const formattedMessages = messages.map(pick(['id', 'message'] as any))
      .filter(({ message }: any) => message && message !== '');
    console.log(`Got ${formattedMessages.length} non empty messages`);
    return formattedMessages;
  }
}

//  const apiId = +(process.env.TG_API_ID as string);
// const apiHash = process.env.TG_API_HASH as string;
// const session = process.env.TG_SESSION as string;
// export const TgChannel =
