
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Menu, Search, Filter } from 'lucide-react';
import Link from 'next/link';

type HeaderProps = {
  categories?: Category[];
  appliedFilters?: Record<string, any[]>;
  onFilterChange?: (filters: Record<string, any[]>) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openMobileFilters: () => void;
};

function Logo() {
    return (
        <Link href="/shop" className="flex items-center space-x-2">
            <span className="font-bold text-2xl font-logo">
                <span className="text-red-600">Ruby</span> Catalogue
            </span>
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


export default function Header({ categories, appliedFilters, onFilterChange, searchTerm, setSearchTerm, openMobileFilters }: HeaderProps) {
  const hasNav = !!(categories && appliedFilters && onFilterChange);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Logo />
        
        {hasNav && (
            <div className="hidden lg:flex flex-1 justify-end">
                <CategoryNav categories={categories} appliedFilters={appliedFilters} onFilterChange={onFilterChange} />
            </div>
        )}

        <div className="lg:hidden flex items-center gap-1">
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Search className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md top-[25%]">
                     <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Search by product name, code, or characteristics..."
                        className="pl-12 pr-4 py-3 h-12 text-base rounded-md shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </DialogContent>
             </Dialog>

             <Button variant="ghost" size="icon" onClick={openMobileFilters}>
                <Filter className="h-6 w-6" />
             </Button>
            
            {hasNav && (
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
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
