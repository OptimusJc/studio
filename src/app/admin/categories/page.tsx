'use client';

import { useMemoFirebase, useCollection, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Grid } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddCategoryDialog } from './components/AddCategoryDialog';
import { EditCategoryDialog } from './components/EditCategoryDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

export default function CategoriesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading } = useCollection<Category>(categoriesCollection);

  const handleDelete = (category: Category) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'categories', category.id);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Category Deleted",
        description: `The category "${category.name}" has been deleted.`,
    });
  };

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Categories"
        description="Organize your products into categories."
      >
        <AddCategoryDialog />
      </PageHeader>

      <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl dark:bg-background/40 ring-1 ring-black/5 dark:ring-white/10 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>A list of all product categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Name</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Description</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
                        <div className="h-3 w-3 rounded-full bg-primary/40 animate-pulse delay-75" />
                        <div className="h-3 w-3 rounded-full bg-primary/60 animate-pulse delay-150" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && categories?.map((category) => (
                <TableRow key={category.id} className="group hover:bg-muted/30 transition-colors duration-200 border-b border-border/40 last:border-0">
                  <TableCell className="font-semibold text-foreground/90">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.description}</TableCell>
                  <TableCell>
                     <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <EditCategoryDialog category={category} />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the category
                                &quot;{category.name}&quot;.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(category)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && categories?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="h-64">
                        <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                            <div className="p-4 rounded-full bg-muted/30 ring-1 ring-border/50 shadow-sm">
                                <Grid className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-foreground/80">No categories found</p>
                                <p className="text-sm">Get started by creating a new category.</p>
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
