import { products, users, categories } from '@/lib/placeholder-data';
import { PageHeader } from './components/PageHeader';
import { StatCard } from './components/StatCard';
import { ShoppingBasket, Users, LayoutGrid, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalCategories = categories.length;
  const recentProducts = products.slice(0, 5);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Dashboard"
        description="Here's a quick overview of your catalog."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Products"
          value={totalProducts.toString()}
          icon={ShoppingBasket}
          description="The total number of products."
        />
        <StatCard 
          title="Total Categories"
          value={totalCategories.toString()}
          icon={LayoutGrid}
          description="The total number of categories."
        />
        <StatCard 
          title="Total Users"
          value={totalUsers.toString()}
          icon={Users}
          description="The total number of users."
        />
        <StatCard 
          title="Shared Links"
          value="12"
          icon={LinkIcon}
          description="Links generated this month."
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>The 5 most recently added products.</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/admin/products">
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'Published' ? 'secondary' : 'outline'}>{product.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
