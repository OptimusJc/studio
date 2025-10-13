import { products } from '@/lib/placeholder-data';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';

export default function ProductsPage() {
  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Products"
        description="Manage all products in your catalog."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline"><Upload /> Bulk Import</Button>
          <Button><PlusCircle /> Add Product</Button>
        </div>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>A list of all products including their status and stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTableClient products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
