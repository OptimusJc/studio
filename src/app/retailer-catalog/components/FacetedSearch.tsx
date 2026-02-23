
'use client';
import * as React from 'react';

import type { Attribute } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, SlidersHorizontal, ChevronRight } from 'lucide-react';
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

  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] bg-white">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-6 w-6 text-gray-600" />
          </Button>
          <h3 className="text-lg font-bold tracking-tight text-gray-900">Filters</h3>
          <Button
            variant="ghost"
            className="p-0 h-auto text-sm font-semibold text-primary hover:bg-transparent hover:underline transition-all"
            onClick={handleResetFilters}
          >
            Clear All
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <Accordion type="multiple" className="w-full">
              {attributes.map((attribute) => (
                <AccordionItem key={attribute.id} value={attribute.id} className="border-b border-gray-100 last:border-0 overflow-hidden">
                  <AccordionTrigger className="font-bold text-base py-5 hover:no-underline hover:text-primary transition-colors [&[data-state=open]>svg]:rotate-90">
                    <span className="flex items-center gap-2">
                      {attribute.name}
                      {appliedFilters[attribute.name.toLowerCase()]?.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {appliedFilters[attribute.name.toLowerCase()].length}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="grid gap-y-4 pt-1">
                      {attribute.values.map((value) => (
                        <div key={value} className="flex items-center space-x-3 group cursor-pointer" onClick={() => handleCheckedChange(attribute.name.toLowerCase(), value, !appliedFilters[attribute.name.toLowerCase()]?.includes(value))}>
                          <Checkbox
                            id={`attr-${attribute.id}-${value}-mobile`}
                            checked={appliedFilters[attribute.name.toLowerCase()]?.includes(value) || false}
                            onCheckedChange={(checked) => handleCheckedChange(attribute.name.toLowerCase(), value, !!checked)}
                            className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-sm"
                          />
                          <Label
                            htmlFor={`attr-${attribute.id}-${value}-mobile`}
                            className="font-medium text-gray-600 group-hover:text-gray-900 leading-tight transition-colors pointer-events-none"
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

        <div className="p-4 border-t sticky bottom-0 bg-white/80 backdrop-blur-md z-10">
          <Button className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" size="lg" onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-gray-900 p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold tracking-tight">Filters</h3>
        </div>
        <Button
          variant="ghost"
          className="p-0 h-auto text-xs font-bold text-gray-400 hover:text-primary hover:bg-transparent transition-all uppercase tracking-widest"
          onClick={handleResetFilters}
        >
          Clear All
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mr-4 pr-4 custom-scrollbar">
        <Accordion type="multiple" defaultValue={attributes.map(a => a.id)} className="w-full space-y-2">
          {attributes.map((attribute) => (
            <AccordionItem key={attribute.id} value={attribute.id} className="border-none bg-gray-50/50 rounded-2xl overflow-hidden px-4">
              <AccordionTrigger className="font-bold text-base py-5 hover:no-underline hover:text-primary transition-all [&[data-state=open]>svg]:rotate-90 text-left">
                <span className="flex items-center gap-2">
                  {attribute.name}
                  {appliedFilters[attribute.name.toLowerCase()]?.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm shadow-primary/30">
                      {appliedFilters[attribute.name.toLowerCase()].length}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid gap-y-4 pt-1">
                  {attribute.values.map((value) => (
                    <div
                      key={value}
                      className="flex items-center space-x-3 group cursor-pointer"
                      onClick={() => handleCheckedChange(attribute.name.toLowerCase(), value, !appliedFilters[attribute.name.toLowerCase()]?.includes(value))}
                    >
                      <Checkbox
                        id={`attr-${attribute.id}-${value}`}
                        checked={appliedFilters[attribute.name.toLowerCase()]?.includes(value) || false}
                        onCheckedChange={(checked) => handleCheckedChange(attribute.name.toLowerCase(), value, !!checked)}
                        className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-sm"
                      />
                      <Label
                        htmlFor={`attr-${attribute.id}-${value}`}
                        className="font-medium text-gray-600 group-hover:text-gray-900 leading-tight transition-colors pointer-events-none"
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
    </div>
  );
}
