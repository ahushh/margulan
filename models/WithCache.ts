// dev purpose only
const fs = require('fs');

export class WithCache {
  pathPrefix = './cache/';

  public fullPath: string;
  constructor(public entity: string) {
    this.fullPath = `${this.pathPrefix + this.entity}.json`;
  }

  save(messages: any[]) {
    fs.writeFileSync(this.fullPath, JSON.stringify(messages), 'utf-8');
  }

  load() {
    const data = fs.readFileSync(this.fullPath, 'utf-8');
    return JSON.parse(data);
  }

  reset() {
    console.log(`Remove cache of ${this.entity}`);
    fs.unlinkSync(this.fullPath);
    return this;
  }

  async do(fetchData: Function) {
    let data;
    try {
      data = this.load();
      console.log(`Loaded ${data.length} ${this.entity} from cache`);
    } catch (e) {
      data = await fetchData();
      this.save(data);
    }
    return data;
  }
}
