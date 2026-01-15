
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
            <Logo className="text-foreground" />
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
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <AppLogo basePath={basePath} />
        
        {hasNav && (
            <div className="hidden lg:flex flex-1 justify-end">
                <CategoryNav categories={categories} appliedFilters={appliedFilters} onFilterChange={onFilterChange} />
            </div>
        )}

        <div className="lg:hidden flex items-center gap-1">
             <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="lg" className="p-2">
                        <Search className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md top-[25%]">
                     <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Search by product name, code, or characteristics..."
                        className="pl-12 pr-10 py-3 h-12 text-base rounded-md shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        />
                         {searchTerm && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                            onClick={() => setSearchTerm('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                </DialogContent>
             </Dialog>
             <Button variant="ghost" size="lg" className="p-2" onClick={openMobileFilters}>
                <Filter className="h-6 w-6" />
             </Button>
            
            {hasNav && (
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="lg" className="p-2">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full max-w-xs">
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
