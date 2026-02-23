
'use client';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Menu, Search, Filter, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/icons/Logo';
import { CATEGORY_GROUPS } from '../lib/constants';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

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

function CategoryNav({ categories, appliedFilters, onFilterChange, className, onCategorySelect }: Pick<HeaderProps, 'categories' | 'appliedFilters' | 'onFilterChange'> & { className?: string, onCategorySelect?: () => void }) {
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
        if (onCategorySelect) {
            onCategorySelect();
        }
    }

    const isMobile = className?.includes('flex-col');

    if (isMobile) {
        return (
            <div className={cn("w-full space-y-4", className)}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "w-full justify-start px-2 py-6 text-lg font-medium rounded-md transition-colors",
                        activeCategory === 'All Categories' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    )}
                    onClick={() => handleCategoryClick('All Categories')}
                >
                    All Products
                </Button>
                <Accordion type="multiple" className="w-full">
                    {CATEGORY_GROUPS.map((group) => (
                        <AccordionItem key={group.label} value={group.label} className="border-none">
                            <AccordionTrigger className="px-2 py-4 text-lg font-medium hover:no-underline hover:bg-gray-50 rounded-md">
                                {group.label}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-4 space-y-1 mt-1">
                                    {group.items.map((cat) => (
                                        <Button
                                            key={cat.id}
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start px-4 py-2 text-base font-normal rounded-md",
                                                activeCategory === cat.name ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                                            )}
                                            onClick={() => handleCategoryClick(cat.name)}
                                        >
                                            {cat.name}
                                        </Button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        )
    }

    return (
        <nav className={cn("flex items-center gap-2", className)}>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0",
                    activeCategory === 'All Categories' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                )}
                onClick={() => handleCategoryClick('All Categories')}
            >
                All Products
            </Button>

            {CATEGORY_GROUPS.map((group) => (
                <DropdownMenu key={group.label}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0 flex items-center gap-1",
                                group.items.some(cat => cat.name === activeCategory) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                            )}
                        >
                            {group.label}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 p-2 bg-white shadow-xl border-gray-100 animate-in fade-in zoom-in duration-200">
                        {group.items.map((cat) => (
                            <DropdownMenuItem
                                key={cat.id}
                                className={cn(
                                    "cursor-pointer px-4 py-2 rounded-md transition-colors",
                                    activeCategory === cat.name ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                                onClick={() => handleCategoryClick(cat.name)}
                            >
                                {cat.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ))}
        </nav>
    )
}


export default function Header({ basePath, categories, appliedFilters, onFilterChange, searchTerm, setSearchTerm, openMobileFilters }: HeaderProps) {
    const hasNav = !!(categories && appliedFilters && onFilterChange);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                            <Button variant="ghost" size="icon" className="h-10 w-10 p-2">
                                <Search />
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
                    <Button variant="ghost" size="icon" className="h-10 w-10 p-2" onClick={openMobileFilters}>
                        <Filter />
                    </Button>

                    {hasNav && (
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 p-2">
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
                                        onCategorySelect={() => setMobileMenuOpen(false)}
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
