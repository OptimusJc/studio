'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import {
  LayoutDashboard,
  ShoppingBasket,
  BookCopy,
  Users,
  Settings,
  LogOut,
  Building,
  Home,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categories } from '@/lib/placeholder-data';
import { useRouter } from 'next/navigation';


const productCategories = [
  { href: 'wallpapers', label: 'Wallpapers', icon: BookCopy },
  { href: 'window-blinds', label: 'Window Blinds', icon: BookCopy },
  { href: 'wall-murals', label: 'Wall Murals', icon: BookCopy },
  { href: 'carpets', label: 'Carpets', icon: BookCopy },
  { href: 'window-films', label: 'Window Films', icon: BookCopy },
  { href: 'fluted-panels', label: 'Fluted Panels', icon: BookCopy },
];

interface AdminSidebarProps {
    selectedDb: string;
    setSelectedDb: (db: string) => void;
}

export default function AdminSidebar({ selectedDb, setSelectedDb }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get('category');

  const handleDbChange = (value: string) => {
    setSelectedDb(value);
    const newPath = `${pathname}?db=${value}${currentCategory ? `&category=${currentCategory}` : ''}`;
    router.push(newPath);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-7 text-primary" />
          <span className="text-lg font-semibold">CatalogLink</span>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname === '/admin' && !currentCategory}
                tooltip="Dashboard"
              >
                <Link href={`/admin?db=${selectedDb}`}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarSeparator />
        
        <div className='px-2 py-1'>
            <Select value={selectedDb} onValueChange={handleDbChange}>
            <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring">
                <div className="flex items-center gap-2">
                {selectedDb === 'retailers' ? <Building className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                <SelectValue placeholder="Select database" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="retailers">
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>Retailers</span>
                    </div>
                </SelectItem>
                <SelectItem value="buyers">
                    <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Buyers</span>
                    </div>
                </SelectItem>
            </SelectContent>
            </Select>
        </div>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/products' && !currentCategory}
                tooltip="All Products"
              >
                <Link href={`/admin/products?db=${selectedDb}`}>
                  <ShoppingBasket />
                  <span>All Products</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          {productCategories.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={currentCategory === item.href}
                tooltip={item.label}
              >
                <Link href={`/admin/products?db=${selectedDb}&category=${item.href}`}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
           <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/users'}
                tooltip="Users"
              >
                <Link href="/admin/users">
                  <Users />
                  <span>Users</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/settings'}
                tooltip="Settings"
              >
                <Link href="/admin/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

      </SidebarContent>
      <SidebarFooter>
         <div className="flex items-center gap-3 p-2">
          <Avatar>
            <AvatarImage src="https://picsum.photos/seed/admin-avatar/40/40" alt="Admin" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Admin User</span>
            <span className="text-xs text-muted-foreground">admin@catalog.link</span>
          </div>
          <SidebarMenuButton variant="ghost" className="ml-auto" size="sm" tooltip="Log Out">
            <LogOut />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
