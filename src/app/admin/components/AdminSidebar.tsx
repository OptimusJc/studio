
'use client';
import { Dispatch, SetStateAction } from "react";
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
  Tags,
  List,
  Folder,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Category, User as AppUser } from '@/types';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

type DbType = "retailers" | "buyers";

interface AdminSidebarProps {
    selectedDb: DbType;
    setSelectedDb: Dispatch<SetStateAction<DbType>>;
    user: AppUser | null;
}

export default function AdminSidebar({ selectedDb, setSelectedDb, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories } = useCollection<Category>(categoriesCollection);

  const currentCategory = searchParams.get('category');

  const handleDbChange = (value: DbType) => {
    setSelectedDb(value);
    const params = new URLSearchParams(searchParams);
    params.set('db', value);
    // When DB changes, clear the category to avoid invalid state
    params.delete('category'); 
    
    // if on a specific product page, navigate to the general products page
    if (pathname.includes('/products/')) {
       router.push(`/admin/products?${params.toString()}`);
    } else {
       router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
      router.push('/login');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: (error as Error).message
      });
    }
  }

  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.currentTarget.getAttribute('data-state') === 'collapsed')) {
      // Prevent click on interactive elements inside from bubbling up
      if ((e.target as HTMLElement).closest('button, a')) {
          return;
      }
      if (typeof (e.currentTarget as any).toggleSidebar === 'function') {
        (e.currentTarget as any).toggleSidebar();
      }
    }
}

  return (
    <Sidebar className="group/sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 border-2 border-gray-200">
          <Logo />
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
                <SelectValue placeholder="Select database" />
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
          {categories?.map((cat) => {
            const categorySlug = cat.name.toLowerCase().replace(/\s+/g, '-');
            return (
              <SidebarMenuItem key={cat.id}>
                <SidebarMenuButton
                  asChild
                  isActive={currentCategory === categorySlug}
                  tooltip={cat.name}
                >
                  <Link href={`/admin/products?db=${selectedDb}&category=${categorySlug}`}>
                    <BookCopy />
                    <span>{cat.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/categories'}
                tooltip="Categories"
              >
                <Link href={`/admin/categories?db=${selectedDb}`}>
                  <List />
                  <span>Categories</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/attributes'}
                tooltip="Attributes"
              >
                <Link href={`/admin/attributes?db=${selectedDb}`}>
                  <Tags />
                  <span>Attributes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/assets'}
                tooltip="Assets"
              >
                <Link href={`/admin/assets?db=${selectedDb}`}>
                  <Folder />
                  <span>Assets</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
           <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/users'}
                tooltip="Users"
              >
                <Link href={`/admin/users?db=${selectedDb}`}>
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
                <Link href={`/admin/settings?db=${selectedDb}`}>
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
            <AvatarImage src={`https://picsum.photos/seed/${user?.id || 'admin'}/40/40`} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
          <SidebarMenuButton variant="ghost" className="ml-auto" size="sm" tooltip="Log Out" onClick={handleLogout}>
            <LogOut />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

    