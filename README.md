## About

Cohere & Weaviate & Telegram API example project

## Usage

Copy env file and fill in missing variables:

```bash
cp .env.example .env
```

Install deps, init TG session and initialize DB scheme:

```bash
npm install
npm run init

```

Run the development server and open [http://localhost:3000](http://localhost:3000)

```bash
npm run dev
```

Clean Weaviate DB:
```bash
npm run reset
```