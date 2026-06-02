import { LightningElement, track } from 'lwc';

const CATEGORIES = [
    { label: 'Veg', value: 'Veg' },
    { label: 'Non-Veg', value: 'Non-Veg' },
    { label: 'Drinks', value: 'Drinks' },
    { label: 'Desserts', value: 'Desserts' },
    { label: 'Combos', value: 'COMBOS' }
];

const DEFAULT_FILTERS = {
    searchTerm: '',
    categories: [],
    minPrice: null,
    maxPrice: null,
    availableOnly: false
};

export default class MenuFilter extends LightningElement {
    categories = CATEGORIES;

    @track filters = { ...DEFAULT_FILTERS };

    handleSearchChange(event) {
        this.filters = { ...this.filters, searchTerm: event.target.value };
        this.dispatchFilterChange();
    }

    handleCategoryChange(event) {
        const value = event.target.dataset.value;
        const checked = event.target.checked;
        let selected = [...this.filters.categories];
        if (checked) {
            selected.push(value);
        } else {
            selected = selected.filter(c => c !== value);
        }
        this.filters = { ...this.filters, categories: selected };
        this.dispatchFilterChange();
    }

    handleMinPriceChange(event) {
        const raw = event.target.value;
        this.filters = { ...this.filters, minPrice: raw !== '' ? parseFloat(raw) : null };
        this.dispatchFilterChange();
    }

    handleMaxPriceChange(event) {
        const raw = event.target.value;
        this.filters = { ...this.filters, maxPrice: raw !== '' ? parseFloat(raw) : null };
        this.dispatchFilterChange();
    }

    handleAvailabilityChange(event) {
        this.filters = { ...this.filters, availableOnly: event.target.checked };
        this.dispatchFilterChange();
    }

    handleReset() {
        this.filters = { ...DEFAULT_FILTERS, categories: [] };
        this.template.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        this.dispatchFilterChange();
    }

    dispatchFilterChange() {
        this.dispatchEvent(new CustomEvent('filterchange', { detail: { ...this.filters } }));
    }

    handleCloseDrawer() {
        this.dispatchEvent(new CustomEvent('closedrawer'));
    }
}
