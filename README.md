# Pantry

A Next.js project with TypeScript, SCSS modules, ESLint, and Prettier.

## Features

- ⚡ **Next.js 15** with App Router
- 🔷 **TypeScript** for type safety
- 🎨 **SCSS Modules** for scoped styling
- 🔍 **ESLint** with Next.js and TypeScript rules
- 💅 **Prettier** for code formatting
- 📦 **Node.js 22.20.0** (specified in `.nvmrc`)

## Getting Started

### Prerequisites

Make sure you have Node.js 22.20.0 or later installed. If you're using `nvm`, run:

```bash
nvm use
```

### Installation

Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── Welcome.tsx      # Example component
│   │   └── Welcome.module.scss # SCSS module
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── public/                 # Static assets
└── ...
```

## SCSS Modules

This project uses SCSS modules for component-scoped styling. Example:

```scss
// Welcome.module.scss
.welcome {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  h1 {
    font-size: 2.5rem;
    color: white;
  }
}
```

```tsx
// Welcome.tsx
import styles from "./Welcome.module.scss";

export default function Welcome() {
  return (
    <div className={styles.welcome}>
      <h1>Welcome!</h1>
    </div>
  );
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
