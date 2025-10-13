import { attributes } from '@/lib/placeholder-data';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AttributesPage() {
  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Attributes"
        description="Manage product attributes like color, size, and material."
      >
        <Button><PlusCircle /> Add Attribute</Button>
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
                <TableHead>Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell className="font-medium">{attribute.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value) => (
                        <Badge key={value} variant="secondary">{value}</Badge>
                      ))}
                    </div>
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
