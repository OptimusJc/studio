export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  status: 'Published' | 'Draft';
  attributes: { [key: string]: string | string[] };
  imageUrl: string;
  imageHint: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  productCount: number;
};

export type Attribute = {
  id: string;
  name: string;
  values: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Customer';
  lastLogin: string;
};
