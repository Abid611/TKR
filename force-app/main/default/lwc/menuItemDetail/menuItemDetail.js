import { LightningElement, api } from 'lwc';

export default class MenuItemDetail extends LightningElement {
    @api item;

    get hasItem() {
        return this.item != null;
    }

    get isUnavailable() {
        return this.item?.Available__c === false;
    }

    get availabilityText() {
        return this.item?.Available__c ? 'In Stock' : 'Unavailable';
    }

    get availabilityClass() {
        return this.item?.Available__c
            ? 'availability-pill available'
            : 'availability-pill unavailable';
    }

    get formattedPrice() {
        const price = this.item?.Price__c;
        if (price == null) return '--';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    }

    handleAddToCart() {
        this.dispatchEvent(
            new CustomEvent('addtocart', { detail: { itemId: this.item.Id } })
        );
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('closedetail'));
    }
}
