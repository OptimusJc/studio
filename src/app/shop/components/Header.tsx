
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Menu } from 'lucide-react';
import Link from 'next/link';

type HeaderProps = {
  categories?: Category[];
  appliedFilters?: Record<string, any[]>;
  onFilterChange?: (filters: Record<string, any[]>) => void;
};

function Logo() {
    return (
        <Link href="/shop" className="flex items-center space-x-2">
            <span className="font-bold text-xl font-serif italic">
                <span className="text-red-600">Ruby</span> Catalogue
            </span>
        </Link>
    )
}

function CategoryNav({ categories, appliedFilters, onFilterChange, className }: HeaderProps & { className?: string }) {
    const activeCategory = appliedFilters?.category?.[0] || 'All Categories';

    const handleCategoryClick = (categoryName: string) => {
        if (!onFilterChange || !appliedFilters) return;
        if (categoryName === 'All Categories') {
            const newFilters = { ...appliedFilters };
            delete newFilters.category;
            onFilterChange(newFilters);
        } else {
            onFilterChange({ ...appliedFilters, category: [categoryName] });
        }
    }
    
    // Manually define categories for now to match the design
    const displayCategories = [
        { id: 'all', name: 'All Categories' },
        { id: 'cat_01', name: 'Wallpapers' },
        { id: 'cat_03', name: 'Wall Murals' },
        { id: 'cat_02', name: 'Window Blinds' },
        { id: 'cat_05', name: 'Window Films' },
        { id: 'cat_04', name: 'Carpets' },
    ];


    return (
        <nav className={cn("flex items-center gap-2", className)}>
            {displayCategories.map((cat) => (
                <Button 
                    key={cat.id} 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-normal",
                        activeCategory === cat.name ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
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
  const hasNav = !!(categories && appliedFilters && onFilterChange);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Logo />
        
        {hasNav && (
            <div className="hidden lg:flex items-center gap-4">
                <CategoryNav categories={categories} appliedFilters={appliedFilters} onFilterChange={onFilterChange} />
            </div>
        )}

        <div className="lg:hidden">
            {hasNav && (
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full max-w-xs">
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
            )}
        </div>
      </div>
    </header>
  );
}
