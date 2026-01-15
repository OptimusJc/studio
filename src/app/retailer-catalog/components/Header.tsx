
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Menu, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/icons/Logo';

type HeaderProps = {
  basePath: string;
  categories?: Category[];
  appliedFilters?: Record<string, any[]>;
  onFilterChange?: (filters: Record<string, any[]>) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openMobileFilters: () => void;
};

function AppLogo({ basePath }: { basePath: string }) {
    return (
        <Link href={basePath || '/'} className="flex items-center space-x-2">
            <Logo className="text-foreground h-auto w-32 md:w-40" />
        </Link>
    )
}

function CategoryNav({ categories, appliedFilters, onFilterChange, className }: Pick<HeaderProps, 'categories'|'appliedFilters'|'onFilterChange'> & { className?: string }) {
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
    
    const displayCategories = [
        { id: 'all', name: 'All Categories' },
        { id: 'cat_01', name: 'Wallpapers' },
        { id: 'cat_03', name: 'Wall Murals' },
        { id: 'cat_02', name: 'Window Blinds' },
        { id: 'cat_05', name: 'Window Films' },
        { id: 'cat_06', name: 'Fluted Panels and WPC Boards'}
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


export default function Header({ basePath, categories, appliedFilters, onFilterChange, searchTerm, setSearchTerm, openMobileFilters }: HeaderProps) {
  const hasNav = !!(categories && appliedFilters && onFilterChange);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setMobileSearchOpen(false);
    }
  };
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background bg-white shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <AppLogo basePath={basePath} />
        
        {hasNav && (
            <div className="hidden lg:flex flex-1 justify-end">
                <CategoryNav categories={categories} appliedFilters={appliedFilters} onFilterChange={onFilterChange} />
            </div>
        )}

        <div className="lg:hidden flex items-center gap-1">
            <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="p-2">
                        <Search className='h-10 w-10' />
                    </Button>
                </SheetTrigger>
                <SheetContent side="top" className="p-4" showOverlay={false}>
                     <div className="relative w-full mt-4 bg-white rounded-md shadow-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search products..."
                          className="pl-12 pr-10 py-3 h-12 text-base rounded-md shadow-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={handleSearchKeyDown}
                          autoFocus
                        />
                         {searchTerm && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                            onClick={() => setSearchTerm('')}
                          >
                            <X className="h-6 w-6" />
                          </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
             <Button variant="ghost" size="icon" className="p-2 h-10 w-10" onClick={openMobileFilters}>
                <Filter />
             </Button>
            
            {hasNav && (
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="p-2 h-10 w-10">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full max-w-xs bg-white">
                        <div className="p-4">
                            <div className="mb-8">
                                <AppLogo basePath={basePath} />
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
