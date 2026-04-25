
"use client";
import { Dispatch, SetStateAction } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import {
  LayoutDashboard,
  Package,
  Library,
  Users,
  Settings,
  LogOut,
  Store,
  ShoppingBag,
  SlidersHorizontal,
  Grid,
  Image,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useAuth,
} from "@/firebase";
import { collection } from "firebase/firestore";
import type { Category, User as AppUser } from "@/types";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

type DbType = "retailers" | "buyers";

interface AdminSidebarProps {
  selectedDb: DbType;
  setSelectedDb: Dispatch<SetStateAction<DbType>>;
  user: AppUser | null;
}

function createSafeSlug(name: string) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}

export default function AdminSidebar({
  selectedDb,
  setSelectedDb,
  user,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "categories");
  }, [firestore]);

  const { data: categories } = useCollection<Category>(categoriesCollection);

  const currentCategory = searchParams.get("category");

  const handleDbChange = (value: DbType) => {
    setSelectedDb(value);
    const params = new URLSearchParams(searchParams);
    params.set("db", value);
    // When DB changes, clear the category to avoid invalid state
    params.delete("category");

    // if on a specific product page, navigate to the general products page
    if (pathname.includes("/products/")) {
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
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: (error as Error).message,
      });
    }
  };

  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget.getAttribute("data-state") === "collapsed") {
      // Prevent click on interactive elements inside from bubbling up
      if ((e.target as HTMLElement).closest("button, a")) {
        return;
      }
      if (typeof (e.currentTarget as any).toggleSidebar === "function") {
        (e.currentTarget as any).toggleSidebar();
      }
    }
  };

  return (
    <Sidebar className="group/sidebar border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.1)] [&>div[data-sidebar=sidebar]]:bg-sidebar/80 [&>div[data-sidebar=sidebar]]:backdrop-blur-xl [&>div[data-sidebar=sidebar]]:border-r [&>div[data-sidebar=sidebar]]:border-r-white/10 dark:[&>div[data-sidebar=sidebar]]:border-r-white/5">
      <SidebarHeader className="pt-6 pb-4 px-6 border-b border-border/40">
        <div className="flex items-center gap-2 transition-transform hover:scale-105 duration-300 origin-left">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-3 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin" && !currentCategory}
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

        <div className="px-2 py-1">
          <Select value={selectedDb} onValueChange={handleDbChange}>
            <SelectTrigger className="w-full h-11 rounded-xl bg-sidebar/50 hover:bg-sidebar/80 transition-colors border-border/50 text-sidebar-foreground shadow-sm focus:ring-primary/20 focus:ring-offset-0">
              <SelectValue placeholder="Select database" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retailers">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span>Retailers</span>
                </div>
              </SelectItem>
              <SelectItem value="buyers">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
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
              isActive={pathname === "/admin/products" && !currentCategory}
              tooltip="All Products"
            >
              <Link href={`/admin/products?db=${selectedDb}`}>
                <Package />
                <span>All Products</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {categories?.map((cat) => {
            const categorySlug = createSafeSlug(cat.name);
            return (
              <SidebarMenuItem key={cat.id}>
                <SidebarMenuButton
                  asChild
                  isActive={currentCategory === categorySlug}
                  tooltip={cat.name}
                >
                  <Link
                    href={`/admin/products?db=${selectedDb}&category=${categorySlug}`}
                  >
                    <Library />
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
              isActive={pathname === "/admin/categories"}
              tooltip="Categories"
            >
              <Link href={`/admin/categories?db=${selectedDb}`}>
                <Grid />
                <span>Categories</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/attributes"}
              tooltip="Attributes"
            >
              <Link href={`/admin/attributes?db=${selectedDb}`}>
                <SlidersHorizontal />
                <span>Attributes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/assets"}
              tooltip="Assets"
            >
              <Link href={`/admin/assets?db=${selectedDb}`}>
                <Image />
                <span>Assets</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/users"}
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
              isActive={pathname === "/admin/settings"}
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
      <SidebarFooter className="p-4 border-t border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <Avatar className="ring-2 ring-background shadow-sm transition-transform hover:scale-110 duration-300">
            <AvatarImage
              src={`https://picsum.photos/seed/${user?.id || "admin"}/40/40`}
              alt={user?.name}
            />
            <AvatarFallback>{user?.name?.charAt(0) || "A"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground w-full truncate">
              {user?.email}
            </span>
          </div>
          <SidebarMenuButton
            variant="ghost"
            className="ml-auto flex-shrink-0 h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-300"
            size="sm"
            tooltip="Log Out"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
