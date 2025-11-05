'use client';

import type { Category, Attribute } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type FacetedSearchProps = {
  categories: Category[];
  attributes: Attribute[];
  appliedFilters: Record<string, any[]>;
  onFilterChange: (filters: Record<string, any[]>) => void;
};

export default function FacetedSearch({ categories, attributes, appliedFilters, onFilterChange }: FacetedSearchProps) {

  const handleRadioChange = (filterKey: string, value: string) => {
    const newFilters = { ...appliedFilters };
    if (!value || value === appliedFilters[filterKey]?.[0]) {
      // If the same value is clicked again, deselect it
      delete newFilters[filterKey];
    } else {
        newFilters[filterKey] = [value];
    }
    onFilterChange(newFilters);
  };
  
  const handleToggleChange = (filterKey: string, checked: boolean) => {
    const newFilters = { ...appliedFilters };
    if (checked) {
      newFilters[filterKey] = [true];
    } else {
      delete newFilters[filterKey];
    }
    onFilterChange(newFilters);
  }

  // Define filters as per the design
  const colorOptions = ['Gray', 'White', 'Red', 'Green'];
  const subCategoryOptions = ['Premium', 'Standard'];

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
        <Accordion type="multiple" defaultValue={['Color', 'Sub Category', 'Material']} className="w-full">
            <AccordionItem value="Color">
              <AccordionTrigger className="font-semibold text-base py-3">Color</AccordionTrigger>
              <AccordionContent className="pt-2">
                <RadioGroup 
                    onValueChange={(value) => handleRadioChange('color', value)}
                    value={appliedFilters['color']?.[0] || ''}
                    className="space-y-2"
                >
                    {colorOptions.map((color) => (
                       <div key={color} className="flex items-center space-x-3">
                        <RadioGroupItem value={color} id={`color-${color}`} />
                        <Label htmlFor={`color-${color}`} className="font-normal text-gray-700">{color}</Label>
                    </div>
                    ))}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="Sub Category">
              <AccordionTrigger className="font-semibold text-base py-3">Sub Category</AccordionTrigger>
              <AccordionContent className="pt-2">
                 <RadioGroup 
                    onValueChange={(value) => handleRadioChange('subCategory', value)}
                    value={appliedFilters['subCategory']?.[0] || ''}
                    className="space-y-2"
                >
                    {subCategoryOptions.map((subCat) => (
                       <div key={subCat} className="flex items-center space-x-3">
                        <RadioGroupItem value={subCat} id={`subCat-${subCat}`} />
                        <Label htmlFor={`subCat-${subCat}`} className="font-normal text-gray-700">{subCat}</Label>
                    </div>
                    ))}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="Material">
              <AccordionTrigger className="font-semibold text-base py-3">Material</AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="material-toggle">Material Toggle</Label>
                    <Switch 
                        id="material-toggle"
                        checked={!!appliedFilters['material']?.[0]}
                        onCheckedChange={(checked) => handleToggleChange('material', checked)}
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="paterial-toggle">Paterial Toggle</Label>
                    <Switch 
                        id="paterial-toggle"
                        checked={!!appliedFilters['paterial']?.[0]}
                        onCheckedChange={(checked) => handleToggleChange('paterial', checked)}
                     />
                 </div>
              </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
