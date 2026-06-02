import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAllMenuItems from '@salesforce/apex/OrderController.getAllMenuItems';
import placeOrder from '@salesforce/apex/OrderController.placeOrder';

const CATEGORY_IMAGES = {
    'Veg':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop',
    'Non-Veg':  'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400&auto=format&fit=crop',
    'Drinks':   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&auto=format&fit=crop',
    'Desserts': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&auto=format&fit=crop',
    'COMBOS':   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop'
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop';


export default class MenuTKR extends NavigationMixin(LightningElement) {
    allMenuItems = [];
    selectedItem = null;
    isFilterOpen = false;
    isCartOpen = false;
    isPlacingOrder = false;
    orderNumber = null;

    @track cartItems = [];

    @track filters = {
        searchTerm: '',
        categories: [],
        minPrice: null,
        maxPrice: null,
        availableOnly: false
    };

    // ── Panel CSS classes ──

    get leftPanelClass()  { return `left-panel${this.isFilterOpen ? ' filter-open' : ''}`; }
    get rightPanelClass() { return `right-panel${this.selectedItem ? ' sheet-open' : ''}`; }
    get backdropClass()   {
        const open = this.isFilterOpen || this.selectedItem || this.isCartOpen;
        return `backdrop${open ? ' visible' : ''}`;
    }

    // ── Cart computed ──

    get cartCount() {
        return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    // ── GraphQL wire ──

    @wire(getAllMenuItems)
    wiredMenu({ data, error }) {
        if (data) {
            this.allMenuItems = data.map(item => ({
                ...item,
                formattedPrice: item.Price__c != null
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.Price__c)
                    : '--',
                imageUrl: CATEGORY_IMAGES[item.Category__c] ?? DEFAULT_IMAGE
            }));
        }
        if (error) {
            console.error('[menuTKR] Apex error:', JSON.stringify(error));
        }
    }

    // ── Filter logic ──

    get filteredItems() {
        const { searchTerm, categories, minPrice, maxPrice, availableOnly } = this.filters;
        let items = this.allMenuItems;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item => item.Name.toLowerCase().includes(term));
        }
        if (categories.length > 0) {
            items = items.filter(item => categories.includes(item.Category__c));
        }
        if (minPrice != null) {
            items = items.filter(item => item.Price__c >= minPrice);
        }
        if (maxPrice != null) {
            items = items.filter(item => item.Price__c <= maxPrice);
        }
        if (availableOnly) {
            items = items.filter(item => item.Available__c === true);
        }
        return items;
    }

    get hasFilteredItems() {
        return this.filteredItems.length > 0;
    }

    // ── Filter handlers ──

    handleFilterChange(event) {
        this.filters = { ...event.detail };
    }

    handleFilterToggle()  { this.isFilterOpen = !this.isFilterOpen; }
    handleCloseFilter()   { this.isFilterOpen = false; }

    // ── Item detail handlers ──

    handleItemClick(event) {
        const itemId = event.currentTarget.dataset.id;
        this.selectedItem = this.allMenuItems.find(item => item.Id === itemId) ?? null;
    }

    handleCloseDetail() { this.selectedItem = null; }

    // ── Cart handlers ──

    handleAddToCart(event) {
        const { itemId } = event.detail;
        const menuItem = this.allMenuItems.find(item => item.Id === itemId);
        if (!menuItem) return;

        const existing = this.cartItems.find(item => item.id === itemId);
        if (existing) {
            this.cartItems = this.cartItems.map(item =>
                item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            this.cartItems = [
                ...this.cartItems,
                {
                    id: menuItem.Id,
                    name: menuItem.Name,
                    price: menuItem.Price__c,
                    quantity: 1,
                    imageUrl: menuItem.imageUrl
                }
            ];
        }
        this.isCartOpen = true;
        this.isFilterOpen = false;
        this.selectedItem = null;
    }

    handleQuantityChange(event) {
        const { itemId, newQuantity } = event.detail;
        if (newQuantity <= 0) {
            this.cartItems = this.cartItems.filter(item => item.id !== itemId);
        } else {
            this.cartItems = this.cartItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
        }
    }

    async handleCheckout(event) {
        const { items, tableNumber, notes } = event.detail;
        const itemsJson = JSON.stringify(
            items.map(item => ({
                menuItemId: item.id,
                quantity:   item.quantity,
                price:      item.price
            }))
        );

        this.isPlacingOrder = true;
        try {
            const name = await placeOrder({ tableNumber, notes, itemsJson });
            this.orderNumber = name;
            this.cartItems   = [];
            this.isCartOpen  = false;
            // Piece 4 — confirmation screen will read this.orderNumber
        } catch (error) {
            console.error('[menuTKR] placeOrder failed:', error?.body?.message ?? error);
        } finally {
            this.isPlacingOrder = false;
        }
    }

    handleCartToggle() {
        this.isCartOpen = !this.isCartOpen;
        if (this.isCartOpen) {
            this.isFilterOpen = false;
            this.selectedItem = null;
        }
    }

    handleCloseCart() { this.isCartOpen = false; }

    handleNewOrder() { this.orderNumber = null; }

    handleTrackOrder() {
        const isLWRSite = window.location.hostname.includes('.my.site.com');
        const isAuraCommunity = window.location.pathname.includes('/s/');
        if (isLWRSite) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: { url: '/my-order?orderNumber=' + encodeURIComponent(this.orderNumber) }
            });
        } else if (isAuraCommunity) {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: { name: 'my-order' },
                state: { orderNumber: this.orderNumber }
            });
        } else {
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: { apiName: 'My_Order' },
                state: { c__orderNumber: this.orderNumber }
            });
        }
    }

    // ── Backdrop ──

    handleBackdropClick() {
        this.isFilterOpen = false;
        this.selectedItem = null;
        this.isCartOpen = false;
    }
}
