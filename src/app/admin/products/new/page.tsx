import { PageHeader } from '../../components/PageHeader';
import { ProductForm } from '../components/ProductForm';
import { attributes } from '@/lib/placeholder-data';

export default function NewProductPage() {
  const attributeData = attributes.reduce((acc, attr) => {
    acc[attr.name.toLowerCase()] = attr.values;
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Add New Product"
        description="Fill in the details below to add a new product to your catalog."
      />
      <ProductForm attributes={attributeData} />
    </div>
  );
}
