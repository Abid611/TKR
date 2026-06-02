import { LightningElement, api } from 'lwc';

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default class CartTKR extends LightningElement {
    @api isOpen = false;
    @api items = [];
    @api isPlacingOrder = false;

    tableNumber = '';
    notes = '';

    get cartPanelClass() {
        return `cart-panel${this.isOpen ? ' cart-open' : ''}`;
    }

    get isEmpty() {
        return !this.items || this.items.length === 0;
    }

    get itemCount() {
        if (!this.items) return 0;
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    get itemCountSuffix() {
        return this.itemCount === 1 ? '' : 's';
    }

    get displayItems() {
        if (!this.items) return [];
        return this.items.map(item => ({
            ...item,
            formattedUnitPrice: CURRENCY_FORMAT.format(item.price)
        }));
    }

    get orderTotal() {
        if (!this.items) return 0;
        return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    get checkoutLabel() {
        return this.isPlacingOrder ? 'Placing Order...' : 'Place Order';
    }

    get formattedTotal() {
        return CURRENCY_FORMAT.format(this.orderTotal);
    }

    handleIncrement(event) {
        const itemId = event.currentTarget.dataset.id;
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            this.dispatchEvent(new CustomEvent('quantitychange', {
                detail: { itemId, newQuantity: item.quantity + 1 }
            }));
        }
    }

    handleDecrement(event) {
        const itemId = event.currentTarget.dataset.id;
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            this.dispatchEvent(new CustomEvent('quantitychange', {
                detail: { itemId, newQuantity: item.quantity - 1 }
            }));
        }
    }

    handleTableChange(event) {
        this.tableNumber = event.target.value;
    }

    handleNotesChange(event) {
        this.notes = event.target.value;
    }

    handleCheckout() {
        this.dispatchEvent(new CustomEvent('checkout', {
            detail: {
                items: this.items,
                tableNumber: this.tableNumber,
                notes: this.notes
            }
        }));
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('closecart'));
    }
}
