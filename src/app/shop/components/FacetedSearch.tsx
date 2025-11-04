'use client';

import type { Category, Attribute } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type FacetedSearchProps = {
  categories: Category[];
  attributes: Attribute[];
  appliedFilters: Record<string, any[]>;
  onFilterChange: (filters: Record<string, any[]>) => void;
};

export default function FacetedSearch({ categories, attributes, appliedFilters, onFilterChange }: FacetedSearchProps) {

  const handleRadioChange = (filterKey: string, value: string) => {
    const newFilters = { ...appliedFilters };
    if (value === 'all' || !value) {
        delete newFilters[filterKey];
    } else {
        newFilters[filterKey] = [value];
    }
    onFilterChange(newFilters);
  };

  const attributeMap = attributes.reduce((acc, attr) => {
    if (!acc[attr.name]) {
      acc[attr.name] = { id: attr.id, values: new Set() };
    }
    attr.values.forEach(val => acc[attr.name].values.add(val));
    return acc;
  }, {} as Record<string, { id: string, values: Set<string> }>);

  return (
    <Card className="sticky top-28 shadow-sm">
      <CardContent className="p-4">
        <Accordion type="multiple" defaultValue={['Color', 'Sub Category', ...Object.keys(attributeMap)]} className="w-full">
          {Object.entries(attributeMap).map(([name, { id, values }]) => (
            <AccordionItem key={id} value={name}>
              <AccordionTrigger className="font-semibold">{name}</AccordionTrigger>
              <AccordionContent>
                <RadioGroup 
                    onValueChange={(value) => handleRadioChange(name.toLowerCase(), value)}
                    value={appliedFilters[name.toLowerCase()]?.[0] || 'all'}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id={`${id}-all`} />
                        <Label htmlFor={`${id}-all`}>All</Label>
                    </div>
                  {[...values].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value} id={`${id}-${value}`} />
                        <Label htmlFor={`${id}-${value}`}>{value}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
