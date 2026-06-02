import { LightningElement, wire, track } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { CurrentPageReference } from 'lightning/navigation';
import getOrderByNumber from '@salesforce/apex/OrderController.getOrderByNumber';

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const CHANNEL = '/event/Order_Status_Event__e';

const STATUS_COLORS = {
    'New':       '#0176d3',
    'Accepted':  '#f4a423',
    'Preparing': '#9b59b6',
    'Ready':     '#27ae60',
    'Delivered': '#1abc9c',
    'Cancelled': '#e74c3c'
};

export default class MyOrdersTKR extends LightningElement {
    orderInput = '';
    isLoading = false;
    errorMessage = null;
    subscription = null;
    @track orderData = null;

    // ── Computed properties ──

    get showForm() {
        return !this.isLoading && !this.orderData;
    }

    get showResult() {
        return !this.isLoading && !!this.orderData;
    }

    get isTrackDisabled() {
        return !this.orderInput?.trim();
    }

    get statusStyle() {
        const color = STATUS_COLORS[this.orderData?.status] ?? '#888';
        return `background-color: ${color}; color: #fff;`;
    }

    get formattedTotal() {
        return CURRENCY_FORMAT.format(this.orderData?.totalAmount ?? 0);
    }

    get formattedOrderTime() {
        if (!this.orderData?.orderTime) return '';
        return new Date(this.orderData.orderTime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    get displayItems() {
        if (!this.orderData?.items) return [];
        return this.orderData.items.map(item => ({
            ...item,
            formattedItemTotal: CURRENCY_FORMAT.format((item.price ?? 0) * (item.quantity ?? 0))
        }));
    }

    // ── Lifecycle ──

    @wire(CurrentPageReference)
    handlePageRef(ref) {
        const orderNumber = ref?.state?.orderNumber ?? ref?.state?.c__orderNumber;
        if (orderNumber && !this.orderData && !this.isLoading) {
            this.orderInput = orderNumber;
            this.handleTrack();
        }
    }

    disconnectedCallback() {
        this.unsubscribeFromEvent();
    }

    // ── Event handlers ──

    handleInputChange(event) {
        this.orderInput = event.target.value;
        this.errorMessage = null;
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') this.handleTrack();
    }

    async handleTrack() {
        const orderNumber = this.orderInput?.trim().toUpperCase();
        if (!orderNumber) return;

        this.isLoading = true;
        this.errorMessage = null;
        this.orderData = null;

        try {
            this.orderData = await getOrderByNumber({ orderNumber });
            this.subscribeToEvent();
        } catch (error) {
            this.errorMessage = error?.body?.message ?? 'Unable to fetch order. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    handleReset() {
        this.unsubscribeFromEvent();
        this.orderData = null;
        this.orderInput = '';
        this.errorMessage = null;
    }

    // ── Platform event subscription ──

    subscribeToEvent() {
        this.unsubscribeFromEvent();

        subscribe(CHANNEL, -1, () => {
            if (this.orderData) {
                this.silentRefresh();
            }
        }).then(response => {
            this.subscription = response;
        });

        onError(error => {
            console.error('[myOrdersTKR] EMP API error:', JSON.stringify(error));
        });
    }

    unsubscribeFromEvent() {
        if (this.subscription) {
            unsubscribe(this.subscription, () => {});
            this.subscription = null;
        }
    }

    async silentRefresh() {
        try {
            this.orderData = await getOrderByNumber({ orderNumber: this.orderData.orderName });
        } catch (error) {
            console.error('[myOrdersTKR] silent refresh failed:', error);
        }
    }
}
