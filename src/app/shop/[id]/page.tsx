
import { redirect } from 'next/navigation';

export default function OldShopProductPage({ params }: { params: { id: string } }) {
  redirect(`/retailer-catalog/${params.id}`);
}
