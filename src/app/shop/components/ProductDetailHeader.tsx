
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';

function Logo() {
    return (
        <Link href="/shop" className="flex items-center space-x-2">
            <span className="font-bold text-2xl font-logo">
                <span className="text-red-600">Ruby</span> Catalogue
            </span>
        </Link>
    )
}

function CategoryNav({ className }: { className?: string }) {
    const displayCategories = [
        { id: 'all', name: 'All Categories', href: '/shop' },
        { id: 'cat_01', name: 'Wallpapers', href: '/shop?filters=eyJjYXRlZ29yeSI6WyJXYWxscGFwZXJzIl19' },
        { id: 'cat_03', name: 'Wall Murals', href: '/shop?filters=eyJjYXRlZ29yeSI6WyJXYWxsIE11cmFscyJdfQ%3D%3D' },
        { id: 'cat_02', name: 'Window Blinds', href: '/shop?filters=eyJjYXRlZ29yeSI6WyJXaW5kb3cgQmxpbmRzIl19' },
        { id: 'cat_05', name: 'Window Films', href: '/shop?filters=eyJjYXRlZ29yeSI6WyJXaW5kb3cgRmlsbXMiXX0%3D' },
        { id: 'cat_04', name: 'Carpets', href: '/shop?filters=eyJjYXRlZ29yeSI6WyJDYXJwZXRzIl19' },
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
                >
                    <Link href={cat.href}>{cat.name}</Link>
                </Button>
            ))}
        </nav>
    )
}


export default function ProductDetailHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Logo />
        
        <div className="hidden lg:flex flex-1 justify-end">
            <CategoryNav />
        </div>

        <div className="lg:hidden flex items-center gap-1">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost">
                        <Menu className="h-8 w-8" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs">
                    <div className="p-4">
                        <div className="mb-8">
                            <Logo />
                        </div>
                        <CategoryNav 
                            className="flex-col items-start gap-4"
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
