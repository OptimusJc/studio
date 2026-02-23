
export type CategoryItem = {
    id: string;
    name: string;
};

export type CategoryGroup = {
    label: string;
    items: CategoryItem[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
    {
        label: 'Walls',
        items: [
            { id: 'cat_01', name: 'Wallpapers' },
            { id: 'cat_03', name: 'Wall Murals' },
            { id: 'cat_06', name: 'Fluted Panels and WPC Boards' },
            { id: 'cat_07', name: 'Contact Paper' },
        ]
    },
    {
        label: 'Windows',
        items: [
            { id: 'cat_02', name: 'Window Blinds' },
            { id: 'cat_05', name: 'Window Films' },
        ]
    },
    {
        label: 'Flooring',
        items: [
            { id: 'cat_08', name: 'Carpets' },
        ]
    }
];

export const DISPLAY_CATEGORIES = CATEGORY_GROUPS.flatMap(group => group.items);
