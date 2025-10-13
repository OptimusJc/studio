'use client';

import type { Category, Attribute } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';

type FacetedSearchProps = {
  categories: Category[];
  attributes: Attribute[];
  appliedFilters: Record<string, any[]>;
  onFilterChange: (filters: Record<string, any[]>) => void;
};

export default function FacetedSearch({ categories, attributes, appliedFilters, onFilterChange }: FacetedSearchProps) {
  const [priceRange, setPriceRange] = useState(appliedFilters.price || [0, 1000]);

  useEffect(() => {
    setPriceRange(appliedFilters.price || [0, 1000]);
  }, [appliedFilters.price]);


  const handleCheckedChange = (filterKey: string, value: string, checked: boolean) => {
    const newFilters = { ...appliedFilters };
    const currentValues = newFilters[filterKey] || [];
    
    if (checked) {
      newFilters[filterKey] = [...currentValues, value];
    } else {
      newFilters[filterKey] = currentValues.filter((v) => v !== value);
    }
    
    onFilterChange(newFilters);
  };
  
  const handlePriceChange = (newRange: number[]) => {
      setPriceRange(newRange);
  }

  const handlePriceCommit = (newRange: number[]) => {
    onFilterChange({ ...appliedFilters, price: newRange });
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Filter Products</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['category', 'price', ...attributes.map(a => a.id)]} className="w-full">
          <AccordionItem value="category">
            <AccordionTrigger>Category</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={appliedFilters.category?.includes(category.name)}
                      onCheckedChange={(checked) => handleCheckedChange('category', category.name, !!checked)}
                    />
                    <label
                      htmlFor={`cat-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="price">
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="p-2">
                <Slider
                  min={0}
                  max={1000}
                  step={10}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  onValueCommit={handlePriceCommit}
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          {attributes.map((attribute) => (
            <AccordionItem key={attribute.id} value={attribute.id}>
              <AccordionTrigger>{attribute.name}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2">
                  {attribute.values.map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attribute.id}-${value}`}
                        checked={appliedFilters[attribute.name]?.includes(value)}
                        onCheckedChange={(checked) => handleCheckedChange(attribute.name, value, !!checked)}
                      />
                      <label
                        htmlFor={`attr-${attribute.id}-${value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
