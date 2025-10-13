# **App Name**: CatalogLink

## Core Features:

- Admin Dashboard: Provides a Next.js based admin interface for managing products, categories, attributes, and users. Supports CRUD operations, bulk import (CSV), and media upload. The dashboard design follows a clean, card-based layout with a light color palette, prominent use of purple for active navigation items, and clear data visualization elements.
- Client Catalog: A public Next.js based product browsing interface with search and faceted filters. Implements SSR for SEO where needed.
- Share Link Generation: Allows admins to generate shareable, secure links that capture a specific search/filter state. These links redirect clients to the client-facing site with the exact filters applied. Generation involves translating filter state to a JSON payload.
- Share Link Resolution: Resolves share links, retrieves the associated filter state, and redirects or serves the client page with pre-applied filters. Includes security checks for link validity and expiration.
- Faceted Search: Allows catalog user to filter results based on product attributes. Makes it easier for users to find the product they are looking for by narrowing down product listings. This relies on indexing searchable fields and attributes.
- Image processing: Automatic thumbnail generation when uploading images using the media service.

## Style Guidelines:

- Primary color: A sophisticated teal (#468499), evoking trust and technological prowess.
- Background color: Light, desaturated teal (#E0F0F4), creating a clean and modern backdrop.
- Accent color: Muted green (#5B9946), drawing attention to key actions.
- Body and headline font: 'Inter', a sans-serif font that provides a modern, clean, and readable experience across the platform.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use a set of minimalistic line icons to represent different categories, attributes, and actions within the catalog. Consistency in style will maintain a professional and clean look.
- Employ a grid-based layout for both the Admin Dashboard and Client Catalog to ensure a structured and responsive design. Prioritize clear visual hierarchy to guide users through the content.
- Incorporate subtle transitions and animations to enhance user interaction. Loading states, filter transitions, and feedback animations should be smooth and non-intrusive.