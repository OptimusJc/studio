
'use client';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Menu, Search, Filter, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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
        <Link href={basePath || '/'} className="flex items-center space-x-2 transition-transform duration-300 hover:scale-105 active:scale-95">
            <Logo className="text-foreground h-auto w-32 md:w-36" />
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
                        "w-full justify-start px-2 py-6 text-xl font-semibold rounded-xl transition-all",
                        activeCategory === 'All Categories' ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted'
                    )}
                    onClick={() => handleCategoryClick('All Categories')}
                >
                    All Products
                </Button>
                <Accordion type="multiple" className="w-full">
                    {CATEGORY_GROUPS.map((group) => (
                        <AccordionItem key={group.label} value={group.label} className="border-none mb-2">
                            <AccordionTrigger className="px-2 py-4 text-lg font-medium hover:no-underline hover:bg-muted rounded-xl transition-colors">
                                {group.label}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-4 space-y-1 mt-1 border-l-2 border-primary/20 ml-2">
                                    {group.items.map((cat) => (
                                        <Button
                                            key={cat.id}
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start px-4 py-3 text-base font-normal rounded-lg transition-colors",
                                                activeCategory === cat.name ? 'bg-primary/5 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
        <nav className={cn("flex items-center gap-1 lg:gap-4", className)}>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "relative h-10 rounded-full px-5 text-sm font-medium transition-all group overflow-hidden",
                    activeCategory === 'All Categories'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
                )}
                onClick={() => handleCategoryClick('All Categories')}
            >
                <span className="relative z-10">All Products</span>
                {activeCategory !== 'All Categories' && (
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4" />
                )}
            </Button>

            {CATEGORY_GROUPS.map((group) => {
                const isGroupActive = group.items.some(cat => cat.name === activeCategory);
                return (
                    <DropdownMenu key={group.label}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "relative h-10 rounded-full px-5 text-sm font-medium transition-all group flex items-center gap-1.5",
                                    isGroupActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
                                )}
                            >
                                <span className="relative z-10">{group.label}</span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180", isGroupActive ? 'opacity-100' : 'opacity-40')} />
                                {!isGroupActive && (
                                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary/40 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            sideOffset={8}
                            className="min-w-[220px] p-2 bg-background/95 backdrop-blur-xl border-muted shadow-2xl animate-in fade-in zoom-in-95 duration-200 rounded-2xl"
                        >
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {group.label}
                            </div>
                            {group.items.map((cat) => (
                                <DropdownMenuItem
                                    key={cat.id}
                                    className={cn(
                                        "flex items-center justify-between cursor-pointer px-3 py-2.5 mb-0.5 rounded-xl transition-all focus:bg-primary/10 focus:text-primary",
                                        activeCategory === cat.name ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80'
                                    )}
                                    onClick={() => handleCategoryClick(cat.name)}
                                >
                                    {cat.name}
                                    {activeCategory === cat.name && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })}
        </nav>
    )
}


export default function Header({ basePath, categories, appliedFilters, onFilterChange, searchTerm, setSearchTerm, openMobileFilters }: HeaderProps) {
    const hasNav = !!(categories && appliedFilters && onFilterChange);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setMobileSearchOpen(false);
        }
    };

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full transition-all duration-500 border-b",
            scrolled
                ? "h-16 bg-background/80 backdrop-blur-xl shadow-lg border-primary/10 py-2"
                : "h-24 bg-background py-4 border-transparent"
        )}>
            <div className="container mx-auto flex h-full items-center justify-between px-6">
                <div className="flex justify-between items-center gap-8 flex-1">
                    <AppLogo basePath={basePath} />

                    {hasNav && (
                        <div className="hidden lg:flex items-center">
                            <div className="h-8 w-[1px] bg-border/60 mx-2 hidden xl:block" />
                            <CategoryNav categories={categories} appliedFilters={appliedFilters} onFilterChange={onFilterChange} />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Desktop Search Integration - Simplified for premium look */}
                    {/* <div className="hidden lg:flex items-center relative group">
                        <div className={cn(
                            "flex items-center bg-muted/50 rounded-full transition-all duration-300 border border-transparent focus-within:border-primary/30 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/5",
                            searchTerm ? "w-64" : "w-48 xl:w-64"
                        )}>
                            <Search className="h-4 w-4 ml-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                type="search"
                                placeholder="Search catalogue..."
                                className="bg-transparent border-none focus-visible:ring-0 h-10 text-sm placeholder:text-muted-foreground/60 pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div> */}

                    <div className="lg:hidden flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                            onClick={() => setMobileSearchOpen(true)}
                        >
                            <Search className="h-5 w-5" />
                        </Button>

                        <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                            <SheetContent side="top" className="p-6 pt-16 rounded-b-[2rem] bg-background/95 backdrop-blur-xl border-none" showOverlay={true}>
                                <div className="relative w-full max-w-2xl mx-auto">
                                    <div className="flex items-center bg-muted rounded-2xl p-2 border-2 border-transparent focus-within:border-primary/50 transition-all">
                                        <Search className="h-5 w-5 ml-2 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="What are you looking for?"
                                            className="px-4 py-6 h-14 text-lg bg-transparent border-none focus-visible:ring-0"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={handleSearchKeyDown}
                                            autoFocus
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-12 w-12 rounded-xl"
                                            onClick={() => setMobileSearchOpen(false)}
                                        >
                                            <X className="h-6 w-6" />
                                        </Button>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                        <p className="w-full text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Trends</p>
                                        {['Wallpaper', 'Panels', 'Carpets'].map(tag => (
                                            <Button key={tag} variant="outline" size="sm" className="rounded-full px-4" onClick={() => { setSearchTerm(tag); setMobileSearchOpen(false); }}>
                                                {tag}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                            onClick={openMobileFilters}
                        >
                            <Filter className="h-5 w-5" />
                        </Button>

                        {hasNav && (
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-full max-w-sm p-0 bg-background border-none flex flex-col">
                                    <div className="p-8 border-b bg-muted/30">
                                        <AppLogo basePath={basePath} />
                                        <p className="mt-4 text-sm text-muted-foreground">Discover the Ruby Catalogue collection of premium interior solutions.</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-6 py-8">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Collections</p>
                                        <CategoryNav
                                            categories={categories}
                                            appliedFilters={appliedFilters}
                                            onFilterChange={onFilterChange}
                                            className="flex-col items-start gap-2"
                                            onCategorySelect={() => setMobileMenuOpen(false)}
                                        />
                                    </div>
                                    <div className="p-8 bg-muted/10 mt-auto">
                                        <Button className="w-full rounded-xl py-6 h-auto text-lg font-medium shadow-none">View All Collections</Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
