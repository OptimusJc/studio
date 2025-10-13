'use client';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import {
  LayoutDashboard,
  ShoppingBasket,
  LayoutGrid,
  Tags,
  Users,
  ExternalLink,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: ShoppingBasket,
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: LayoutGrid,
  },
  {
    href: '/admin/attributes',
    label: 'Attributes',
    icon: Tags,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

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
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
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
                isActive={pathname === '/catalog'}
                tooltip="View Catalog"
              >
                <Link href="/catalog" target="_blank">
                  <ExternalLink />
                  <span>View Catalog</span>
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
