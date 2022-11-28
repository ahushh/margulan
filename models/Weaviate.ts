/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
require('dotenv').config();

const weaviate = require('weaviate-client');

export class Weaviate {
  static BATCHER_MAX = 20;

  public client: any;
  constructor(public host: string, public scheme = 'http') {
    this.client = weaviate.client({
      scheme,
      host,
    });
  }
  static formatMessages(messages: any[]) {
    return (messages ?? []).map(({ text, message_id, _additional: { id } }: any) => ({ text, message_id, id }));
  }
  async createSchema() {
    const channelClass = {
      class: 'Channel',
      description: 'Telegram channel',
      properties: [
        {
          dataType: [
            'string',
          ],
          description: 'Telegram channel ID', // e.g. @MargulanSeissembai
          name: 'name',
        },
      ],
    };

    const messageClass = {
      class: 'Message',
      description: 'Message of a telegram chnnel',
      properties: [
        {
          dataType: [
            'int',
          ],
          description: 'Message ID',
          name: 'message_id',
        },
        {
          dataType: [
            'text',
          ],
          description: 'Message text',
          name: 'text',
        },
        {
          dataType: [
            'Channel',
          ],
          description: 'Telegram channel ref',
          name: 'channel',
        },
      ],
    };
    await this.client
      .schema
      .classCreator()
      .withClass(channelClass)
      .do()
      .then((res) => {
        console.log('Created channel schema');
      })
      .catch((err) => {
        console.error(err);
      });

    await this.client
      .schema
      .classCreator()
      .withClass(messageClass)
      .do()
      .then((res) => {
        console.log('Created message schema');
      })
      .catch((err) => {
        console.error(err);
      });

    await this.client.schema
      .propertyCreator()
      .withClassName('Channel')
      .withProperty(
        {
          dataType: [
            'Message',
          ],
          description: 'Ref to message',
          name: 'message',
        },
      )
      .do()
      .then((res) => {
        console.log('Add message reference to channel schema');
      })
      .catch((err) => {
        console.error(err);
      });
  }

  async importChannelWithMessages(channelName: string, messagesWithEmbeddings: any[]) {
    const [c] = await this.importChannel(channelName);
    const ms = await this.importMessages(messagesWithEmbeddings);
    await this.addRefsBetweenChannelAndMessages(c, ms);
  }

  private async importChannel(name: string) {
    let batcher = this.client.batch.objectsBatcher();
    const obj = {
      class: 'Channel',
      properties: {
        name,
      },
    };

    batcher = batcher.withObject(obj);
    return batcher
      .do()
      .then((res) => {
        console.log('Imported channel', name);
        return res;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  private async importMessages(messagesWithEmbeddings: any[]) {
    let batcher = this.client.batch.objectsBatcher();
    let counter = 0;
    let result: any[] = [];
    for (const msg of messagesWithEmbeddings) {
      const obj = {
        class: 'Message',
        properties: {
          message_id: msg.id,
          text: msg.message,
        },
        vector: msg.embeddings,
      };

      batcher = batcher.withObject(obj);

      if (counter === Weaviate.BATCHER_MAX) {
        await batcher
          .do()
          .then((res) => {
            console.log(`Imported ${Weaviate.BATCHER_MAX} messages...`);
            result = [...result, ...res];
          })
          .catch((err) => {
            console.error('importMessages', err);
          });

        // restart the batch queue
        counter = 0;
        batcher = this.client.batch.objectsBatcher();
      }
      counter += 1;
    }

    return batcher
      .do()
      .then((res) => {
        result = [...result, ...res];
        console.log(`Imported ${result.length} messages to Weaviate in total`);
        return result;
      })
      .catch((err) => {
        console.error('importMessages', err);
      });
  }

  async addRefsBetweenChannelAndMessages(channel: any, messages: any[]) {
    let i = 0;
    for (const msg of messages) {
      ++i;
      await this.client.data
        .referenceCreator()
        .withClassName('Channel')
        .withId(channel.id)
        .withReferenceProperty('message')
        .withReference(
          this.client.data
            .referencePayloadBuilder()
            .withClassName('Message')
            .withId(msg.id)
            .payload(),
        )
        .do()
        .then(() => {
          console.log(`addRefsBetweenChannelAndMessages: channel2message ${i}/${messages.length} `)
        })
        .catch((err) => {
          console.error(`addRefsBetweenChannelAndMessages error: channel2message ${i}/${messages.length} `, err);
        });
      await this.client.data
        .referenceCreator()
        .withClassName('Message')
        .withId(msg.id)
        .withReferenceProperty('channel')
        .withReference(
          this.client.data
            .referencePayloadBuilder()
            .withClassName('Channel')
            .withId(channel.id)
            .payload(),
        )
        .do()
        .then(() => {
          console.log(`addRefsBetweenChannelAndMessages: message2channel ${i}/${messages.length} `)
        })
        .catch((err) => {
          console.error(`addRefsBetweenChannelAndMessages error: message2channel ${i}/${messages.length} `, err);
        });
    }
  }

  async getRelevantMessagesById(channelName: string, id: string, distance?: number, certainty?: number) {
    const { data: { Get: { Message: [{ _additional: { vector } }] } } } = await this.client.graphql
      .get()
      .withClassName('Message')
      .withFields('_additional { vector }')
      .withWhere({
        operator: 'Equal',
        path: ['id'],
        valueString: id,
      })
      .do()
      .then(x => {
        return x;
      })
    return this.search(channelName, vector, distance, certainty);
  }

  getMessages(channelName: string) {
    return this.client.graphql
      .get()
      .withClassName('Channel')
      .withFields('name _additional { id } message { ... on Message { text message_id _additional { id } }}')
      .withWhere({
        operator: 'Equal',
        path: ['name'],
        valueString: channelName,
      })
      .do()
      .then((res) => {
        const { data: { Get: { Channel } } } = res;
        const channel = Channel[0];
        return Weaviate.formatMessages(channel?.message);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  getAllChannels() {
    return this.client.graphql
      .get()
      .withClassName('Channel')
      .withFields('name')
      .do()
      .catch((err) => {
        console.error(err);
      });
  }

  search(channelName: string, vector: number[], distance?: number, certainty?: number) {
    const options: any = {
      vector,
    };
    if (distance !== undefined) {
      options.distance = +distance;
    } else if (certainty !== undefined) {
      options.certainty = +certainty;
    }
    return this.client.graphql
      .get()
      .withClassName('Message')
      .withFields('message_id text _additional { id distance certainty } channel { ... on Channel { name }}')
      .withWhere({
        operator: 'Equal',
        path: ['channel', 'Channel', 'name'],
        valueString: channelName,
      })
      .withNearVector(options)
      .do()
      // eslint-disable-next-line arrow-body-style
      .then((res) => {
        return Weaviate.formatMessages(res.data?.Get?.Message);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}

