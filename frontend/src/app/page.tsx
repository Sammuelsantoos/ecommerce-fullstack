import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
        TechStore
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        E-commerce full-stack construído com Next.js, NestJS, Prisma e
        PostgreSQL.
      </p>
      <Link href="/products" className="mt-8">
        <Button size="lg">Ver produtos</Button>
      </Link>
    </div>
  );
}
