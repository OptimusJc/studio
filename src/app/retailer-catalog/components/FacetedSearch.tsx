
'use client';

import type { Attribute } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

type FacetedSearchProps = {
  attributes: Attribute[];
  appliedFilters: Record<string, any[]>;
  onFilterChange: (filters: Record<string, any[]>) => void;
  isMobile?: boolean;
  onClose?: () => void;
};

export default function FacetedSearch({ attributes, appliedFilters, onFilterChange, isMobile, onClose }: FacetedSearchProps) {

  const handleCheckedChange = (filterKey: string, value: string, checked: boolean) => {
    const newFilters = { ...appliedFilters };
    const currentValues = newFilters[filterKey] || [];
    
    if (checked) {
      newFilters[filterKey] = [...currentValues, value];
    } else {
      newFilters[filterKey] = currentValues.filter((v) => v !== value);
    }
    
    if (newFilters[filterKey].length === 0) {
      delete newFilters[filterKey];
    }
    
    onFilterChange(newFilters);
  };
  
  const handleResetFilters = () => {
    onFilterChange({});
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
          <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-8 w-8" />
          </Button>
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button variant="link" className="p-0 h-auto text-sm" onClick={handleResetFilters}>
              Reset All
          </Button>
        </div>

        <ScrollArea className="flex-1">
            <div className="p-4">
                <Accordion type="multiple" className="w-full">
                    {attributes.map((attribute) => (
                    <AccordionItem key={attribute.id} value={attribute.id}>
                        <AccordionTrigger className="font-semibold text-base py-3">{attribute.name}</AccordionTrigger>
                        <AccordionContent className="pt-2">
                        <div className="grid gap-y-3">
                            {attribute.values.map((value) => (
                            <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                id={`attr-${attribute.id}-${value}-mobile`}
                                checked={appliedFilters[attribute.name.toLowerCase()]?.includes(value) || false}
                                onCheckedChange={(checked) => handleCheckedChange(attribute.name.toLowerCase(), value, !!checked)}
                                />
                                <Label
                                htmlFor={`attr-${attribute.id}-${value}-mobile`}
                                className="font-normal text-card-foreground leading-tight"
                                >
                                {value}
                                </Label>
                            </div>
                            ))}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </ScrollArea>
        
        <div className="p-4 border-t sticky bottom-0 bg-background z-10">
            <Button className="w-full" size="lg" onClick={onClose}>Apply Filters</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card text-card-foreground p-6 rounded-lg shadow-sm">
       <div className="flex items-center justify-between border-b pb-4 mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="link" className="p-0 h-auto text-sm" onClick={handleResetFilters}>
            Reset All
        </Button>
      </div>
      <ScrollArea className="h-full max-h-[65vh] pr-4 -mr-4">
        <Accordion type="multiple" className="w-full">
          {attributes.map((attribute) => (
            <AccordionItem key={attribute.id} value={attribute.id}>
              <AccordionTrigger className="font-semibold text-base py-3">{attribute.name}</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid gap-y-3">
                  {attribute.values.map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attribute.id}-${value}`}
                        checked={appliedFilters[attribute.name.toLowerCase()]?.includes(value) || false}
                        onCheckedChange={(checked) => handleCheckedChange(attribute.name.toLowerCase(), value, !!checked)}
                      />
                      <Label
                        htmlFor={`attr-${attribute.id}-${value}`}
                        className="font-normal text-card-foreground leading-tight"
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
