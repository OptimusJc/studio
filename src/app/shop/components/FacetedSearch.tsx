
'use client';

import type { Attribute } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const WrapperComponent = isMobile ? 'div' : 'div';
  const wrapperProps = isMobile ? {} : { className: "w-full bg-white p-6 rounded-lg shadow-sm" };

  return (
    <WrapperComponent {...wrapperProps}>
       <div className={cn("flex items-center justify-between border-b mb-4", isMobile ? "py-4" : "pb-4")}>
        <h3 className="text-lg font-semibold">Filters</h3>
        {isMobile ? (
             <Button variant="ghost" size="icon" onClick={handleResetFilters}>
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Reset All</span>
            </Button>
        ) : (
            <Button variant="link" className="p-0 h-auto text-sm" onClick={handleResetFilters}>
                Reset All
            </Button>
        )}
      </div>
      <Accordion type="multiple" defaultValue={[...attributes.map(a => a.id)]} className="w-full">
        {attributes.map((attribute) => (
          <AccordionItem key={attribute.id} value={attribute.id}>
            <AccordionTrigger className="font-semibold text-base py-3">{attribute.name}</AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                {attribute.values.map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`attr-${attribute.id}-${value}`}
                      checked={appliedFilters[attribute.name.toLowerCase()]?.includes(value)}
                      onCheckedChange={(checked) => handleCheckedChange(attribute.name.toLowerCase(), value, !!checked)}
                    />
                    <Label
                      htmlFor={`attr-${attribute.id}-${value}`}
                      className="font-normal text-gray-700 leading-tight"
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
    </WrapperComponent>
  );
}
