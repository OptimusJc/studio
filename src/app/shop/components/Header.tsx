
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Menu } from 'lucide-react';
import Link from 'next/link';

type HeaderProps = {
  categories: Category[];
  appliedFilters: Record<string, any[]>;
  onFilterChange: (filters: Record<string, any[]>) => void;
};

function Logo() {
    return (
        <Link href="/shop" className="flex items-center space-x-2">
            <span className="font-bold text-xl font-serif">
                <span className="text-red-600">Ruby</span> Catalogue
            </span>
        </Link>
    )
}

function CategoryNav({ categories, appliedFilters, onFilterChange, className }: HeaderProps & { className?: string }) {
    const activeCategory = appliedFilters.category?.[0] || 'All Categories';

    const handleCategoryClick = (categoryName: string) => {
        if (categoryName === 'All Categories') {
            const newFilters = { ...appliedFilters };
            delete newFilters.category;
            onFilterChange(newFilters);
        } else {
            onFilterChange({ ...appliedFilters, category: [categoryName] });
        }
    }

    return (
        <nav className={cn("flex items-center gap-2", className)}>
            <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                    "rounded-full", 
                    activeCategory === 'All Categories' && 'bg-accent text-accent-foreground'
                )}
                onClick={() => handleCategoryClick('All Categories')}
            >
                All Categories
            </Button>
            {categories.map((cat) => (
                <Button 
                    key={cat.id} 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                        "rounded-full",
                        activeCategory === cat.name && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleCategoryClick(cat.name)}
                >
                    {cat.name}
                </Button>
            ))}
        </nav>
    )
}


export default function Header({ categories, appliedFilters, onFilterChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Logo />
        
        <div className="hidden lg:flex lg:justify-center lg:flex-1">
            <CategoryNav categories={categories} appliedFilters={appliedFilters} onFilterChange={onFilterChange} />
        </div>

        <div className="lg:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <div className="p-4">
                        <div className="mb-8">
                            <Logo />
                        </div>
                        <CategoryNav 
                            categories={categories} 
                            appliedFilters={appliedFilters} 
                            onFilterChange={onFilterChange}
                            className="flex-col items-start gap-4"
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        <div className="hidden lg:flex w-[138px]">
            {/* Placeholder for potential right-side content */}
        </div>
      </div>
    </header>
  );
}
