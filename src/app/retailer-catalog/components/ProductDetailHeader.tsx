
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu, ChevronDown } from 'lucide-react';
import Link from 'next/link';
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

    const isMobile = className?.includes('flex-col');

    if (isMobile) {
        return (
            <div className={cn("w-full space-y-4", className)}>
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-full justify-start px-2 py-6 text-lg font-medium rounded-md text-gray-600 hover:bg-gray-50"
                    onClick={onLinkClick}
                >
                    <Link href={basePath}>All Products</Link>
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
                                            asChild
                                            className="w-full justify-start px-4 py-2 text-base font-normal rounded-md text-gray-500 hover:bg-gray-50"
                                            onClick={onLinkClick}
                                        >
                                            <Link href={getCategoryFilterUrl(cat.name)}>{cat.name}</Link>
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
                asChild
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 shrink-0"
                onClick={onLinkClick}
            >
                <Link href={basePath}>All Products</Link>
            </Button>

            {CATEGORY_GROUPS.map((group) => (
                <DropdownMenu key={group.label}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 shrink-0 flex items-center gap-1"
                        >
                            {group.label}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 p-2 bg-white shadow-xl border-gray-100 animate-in fade-in zoom-in duration-200">
                        {group.items.map((cat) => (
                            <DropdownMenuItem
                                key={cat.id}
                                asChild
                                className="cursor-pointer px-4 py-2 rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <Link href={getCategoryFilterUrl(cat.name)} onClick={onLinkClick}>
                                    {cat.name}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
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
