
'use client';

import { useMemo, useState } from 'react';
import { useMemoFirebase, useCollection, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddAttributeDialog } from './components/AddAttributeDialog';
import { EditAttributeDialog } from './components/EditAttributeDialog';
import type { Attribute, Category } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AttributesPage() {
  const firestore = useFirestore();
  const [categoryFilter, setCategoryFilter] = useState('All');

  const attributesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'attributes');
  }, [firestore]);

  const { data: attributes, isLoading: isLoadingAttributes } = useCollection<Attribute>(attributesCollection);
  
  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const handleDelete = (attributeId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'attributes', attributeId);
    deleteDocumentNonBlocking(docRef);
  };
  
  const filteredAttributes = useMemo(() => {
    if (!attributes) return [];
    if (categoryFilter === 'All') return attributes;
    return attributes.filter(attr => attr.category === categoryFilter);
  }, [attributes, categoryFilter]);

  const isLoading = isLoadingAttributes || isLoadingCategories;

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Attributes"
        description="Manage product attributes like color, size, and material."
      >
        <AddAttributeDialog />
      </PageHeader>

      <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl dark:bg-background/40 ring-1 ring-black/5 dark:ring-white/10 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Attribute List</CardTitle>
            <CardDescription>A list of all product attributes and their possible values.</CardDescription>
          </div>
          <div className="w-full md:w-48 pt-4 md:pt-0">
             <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={isLoadingCategories}>
                <SelectTrigger className="w-full bg-background/50 hover:bg-background/80 transition-colors rounded-xl border-border/50 shadow-sm focus:ring-primary/20">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Attribute Name</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Category</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Values</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading attributes...</TableCell>
                </TableRow>
              )}
              {!isLoading && filteredAttributes.map((attribute) => (
                <TableRow key={attribute.id} className="group hover:bg-muted/30 transition-colors duration-200 border-b border-border/40 last:border-0">
                  <TableCell className="font-semibold text-foreground/90">{attribute.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium px-3 py-1 rounded-full tracking-wide">
                      {attribute.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value, i) => (
                        <Badge key={`${value}-${i}`} variant="secondary" className="bg-muted/50 text-foreground hover:bg-muted transition-colors rounded-lg px-2.5 py-0.5 border border-border/50 shadow-sm">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditAttributeDialog attribute={attribute} />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(attribute.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && filteredAttributes.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-64">
                        <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                            <div className="p-4 rounded-full bg-muted/30 ring-1 ring-border/50 shadow-sm">
                                <SlidersHorizontal className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-foreground/80">No attributes found</p>
                                <p className="text-sm">Try adjusting your filters or add a new attribute.</p>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
