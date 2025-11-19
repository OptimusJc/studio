
'use client';
import { z } from 'zod';

export type Product = {
  id: string;
  name: string;
  category: string;
  price?: number;
  stock: number;
  stockStatus: 'In Stock' | 'Out of Stock';
  sku: string;
  status: 'Published' | 'Draft';
  attributes: { [key: string]: string | string[] };
  imageUrl: string;
  imageHint: string;
  createdAt: string;
  // Fields from the form that might not be on the simplified type
  productCode?: string;
  productTitle?: string;
  productDescription?: string;
  productImages?: string[];
  additionalImages?: string[];
  specifications?: string;
  db: 'retailers' | 'buyers';
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type Attribute = {
  id: string;
  name: string;
  category: string;
  values: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor';
  createdAt: string;
  lastLogin: string | null;
};
