'use client';

import { Logo } from '@/components/icons/Logo';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

type HeaderProps = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

export default function Header({ searchTerm, setSearchTerm }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/catalog" className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">CatalogLink</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
