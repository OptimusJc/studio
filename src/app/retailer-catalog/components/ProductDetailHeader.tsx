
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';


function AppLogo({ basePath }: { basePath: string }) {
    return (
        <Link href={basePath || '/'} className="flex items-center space-x-2">
            <Logo className="text-foreground h-auto w-32 md:w-40" />
        </Link>
    )
}

function CategoryNav({ className, basePath, onLinkClick }: { className?: string, basePath: string, onLinkClick?: () => void }) {

    const getCategoryFilterUrl = (categoryName: string) => {
        const filters = { category: [categoryName] };
        const encodedFilters = btoa(JSON.stringify(filters));
        return `${basePath}?filters=${encodedFilters}`;
    }

    const displayCategories = [
        { id: 'all', name: 'All Categories', href: basePath },
        { id: 'cat_01', name: 'Wallpapers', href: getCategoryFilterUrl('Wallpapers') },
        { id: 'cat_03', name: 'Wall Murals', href: getCategoryFilterUrl('Wall Murals') },
        { id: 'cat_07', name: 'Contact Paper', href: getCategoryFilterUrl('Contact Paper') },
        { id: 'cat_02', name: 'Window Blinds', href: getCategoryFilterUrl('Window Blinds') },
        { id: 'cat_05', name: 'Window Films', href: getCategoryFilterUrl('Window Films') },
        { id: 'cat_06', name: 'Fluted Panels & WPC Boards', href: getCategoryFilterUrl('Fluted Panels and WPC Boards') },
        { id: 'cat_08', name: 'Carpets', href: getCategoryFilterUrl('Carpets') }
    ];

    return (
        <nav className={cn("flex items-center gap-2", className)}>
            {displayCategories.map((cat) => (
                <Button
                    key={cat.id}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-normal",
                        'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                    )}
                    onClick={onLinkClick}
                >
                    <Link href={cat.href}>{cat.name}</Link>
                </Button>
            ))}
        </nav>
    )
}


export default function ProductDetailHeader({ basePath = '/' }: { basePath?: string }) {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background bg-white shadow-sm">
            <div className="container mx-auto flex h-20 items-center justify-between px-4">
                <AppLogo basePath={basePath} />

                <div className="hidden lg:flex flex-1 justify-end">
                    <CategoryNav basePath={basePath} />
                </div>

                <div className="lg:hidden flex items-center gap-1">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="lg" className="h-10 w-10 p-2">
                                <Menu />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full max-w-xs">
                            <div className="p-4">
                                <div className="mb-8">
                                    <AppLogo basePath={basePath} />
                                </div>
                                <CategoryNav
                                    className="flex-col items-start gap-4"
                                    basePath={basePath}
                                    onLinkClick={() => setMobileMenuOpen(false)}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
