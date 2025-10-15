'use client';

import { useMemoFirebase, useCollection, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddAttributeDialog } from './components/AddAttributeDialog';
import { EditAttributeDialog } from './components/EditAttributeDialog';

type Attribute = {
  id: string;
  name: string;
  category: string;
  values: string[];
};

export default function AttributesPage() {
  const firestore = useFirestore();

  const attributesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'attributes');
  }, [firestore]);

  const { data: attributes, isLoading } = useCollection<Attribute>(attributesCollection);

  const handleDelete = (attributeId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'attributes', attributeId);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Attributes"
        description="Manage product attributes like color, size, and material."
      >
        <AddAttributeDialog />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Attribute List</CardTitle>
          <CardDescription>A list of all product attributes and their possible values.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribute Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Values</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading attributes...</TableCell>
                </TableRow>
              )}
              {!isLoading && attributes?.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell className="font-medium">{attribute.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{attribute.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value) => (
                        <Badge key={value} variant="secondary">{value}</Badge>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
