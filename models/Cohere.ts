import cohere from 'cohere-ai';

export class Cohere {
  static DATA_LIMIT = 100;

  constructor(public apiKey: string, public isTrial: boolean, public model = 'large') {
    console.log('Cohere: isTrial=', isTrial)
    cohere.init(this.apiKey);
  }

  // eslint-disable-next-line class-methods-use-this
  async getEmbedding(message: string) {
    try {
      const response = await cohere.embed({
        model: this.model,
        texts: [message],
      });
      const { embeddings: [vector] } = response.body;

      return vector;
    } catch (e) {
      console.error('cohere: error', e);
      throw e;
    }
  }

  async getMessagesWithEmbeddings(messages: any[]) {
    const formattedMessages = this.isTrial
      ? messages.slice(0, Cohere.DATA_LIMIT)
      : messages;

    try {
      const texts = formattedMessages.map(({ message }) => message);
      const response = await cohere.embed({
        model: this.model,
        texts,
      });
      const { embeddings } = response.body;
      console.log(`cohere: got ${embeddings.length} embeddings`);

      return formattedMessages.map((m, i) => ({ ...m, embeddings: embeddings[i] }));
    } catch (e) {
      console.error('cohere: error', e);
      throw e;
    }
  }
}
