import cohere from 'cohere-ai';

export class Cohere {
  static RATE_LIMIT = 100;
  static RETRY_COUNT = 5;
  static RETRY_DELAY = 2 * 1000;

  constructor(public apiKey: string, public isTrial: boolean, public model = 'large') {
    console.log('Cohere: isTrial=', isTrial)
    cohere.init(this.apiKey);
  }

  // eslint-disable-next-line class-methods-use-this
  async getEmbedding(message: string, retryCount = 0) {
    if (retryCount === Cohere.RETRY_COUNT) {
      throw new Error('getEmbedding retry limit exceeded');
    }
    try {
      const response = await cohere.embed({
        model: this.model,
        texts: [message],
      });
      const { embeddings: [vector] } = response.body;

      return vector;
    } catch (e) {
      console.error('cohere: error', e);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(this.getEmbedding(message, retryCount + 1))
        }, Cohere.RETRY_DELAY);
      });
    }
  }

  private async _getMessagesWithEmbeddings(messages: any[]) {
    const texts = messages.map(({ message }) => message);
    const response = await cohere.embed({
      model: this.model,
      texts,
    });
    const { embeddings } = response.body;
    return messages.map((m, i) => ({ ...m, embeddings: embeddings[i] }));
  }
  async getMessagesWithEmbeddings(messages: any[]) {
    let grouppedMessages: any[][] = [messages];
    if (this.isTrial) {
      grouppedMessages = [];
      const result = [...messages];
      while (result.length) {
        grouppedMessages.push(
          result.splice(0, Cohere.RATE_LIMIT)
        )
      }
    }
    try {
      let result: any[] = [];
      for (let i = 0; i < grouppedMessages.length; i++) {
        const group = grouppedMessages[i];
        console.log(`cohere: processing ${i + 1}/${grouppedMessages.length} batch of messages`);
        const start = +new Date();
        const data = await this._getMessagesWithEmbeddings(group);
        const end = +new Date();
        const seconds = (end - start) / 1000;
        console.log(`cohere: sleeping for ${seconds} seconds`);
        result = [...result, ...data];
        await new Promise<void>((resolve) => setTimeout(() => { resolve() }, end - start));
      }
      console.log(`cohere: got ${result.length} embeddings`);
      return result;
    } catch (e) {
      console.error('cohere: error', e);
      throw e;
    }
  }
}
