import { LightningElement, track } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveOrders from '@salesforce/apex/OrderController.getActiveOrders';
import updateOrderStatus from '@salesforce/apex/OrderController.updateOrderStatus';

const CHANNEL = '/event/Order_Status_Event__e';

const STATUS_COLORS = {
    'New':       '#0176d3',
    'Accepted':  '#f4a423',
    'Preparing': '#9b59b6',
    'Ready':     '#27ae60'
};

const NEXT_STATUS_MAP = {
    'New':       { status: 'Accepted',  label: 'Accept Order' },
    'Accepted':  { status: 'Preparing', label: 'Start Preparing' },
    'Preparing': { status: 'Ready',     label: 'Mark Ready' },
    'Ready':     { status: 'Delivered', label: 'Mark Delivered' }
};

const CANCEL_BLOCKED = new Set(['Ready', 'Delivered', 'Cancelled']);

export default class KitchenOrdersTKR extends LightningElement {
    @track orders = [];
    isLoading = false;
    isUpdating = false;
    subscription = null;

    // Tracks which card is showing the cancel confirm panel
    confirmingCancelId = null;
    cancelReason = '';

    // ── Computed properties ──

    get activeOrderCount() {
        return this.orders.length;
    }

    get isEmpty() {
        return this.orders.length === 0;
    }

    get isConfirmCancelDisabled() {
        return this.isUpdating || !this.cancelReason?.trim();
    }

    get displayOrders() {
        const now = Date.now();
        return this.orders.map(order => {
            const next = NEXT_STATUS_MAP[order.status];
            const color = STATUS_COLORS[order.status] ?? '#888';
            const elapsedMin = order.orderTime
                ? Math.floor((now - new Date(order.orderTime).getTime()) / 60000)
                : 0;
            return {
                ...order,
                cardClass:          `order-card card-${(order.status ?? '').toLowerCase()}`,
                statusStyle:        `background-color: ${color}; color: #fff;`,
                nextStatus:         next?.status ?? null,
                nextLabel:          next?.label ?? null,
                canCancel:          !CANCEL_BLOCKED.has(order.status),
                elapsedLabel:       elapsedMin < 1 ? 'just now' : `${elapsedMin}m ago`,
                isConfirmingCancel: order.orderId === this.confirmingCancelId
            };
        });
    }

    // ── Lifecycle ──

    connectedCallback() {
        this.loadOrders();
        this.subscribeToEvent();
    }

    disconnectedCallback() {
        if (this.subscription) {
            unsubscribe(this.subscription, () => {});
        }
    }

    // ── Data loading ──

    async loadOrders() {
        this.isLoading = true;
        try {
            this.orders = await getActiveOrders();
        } catch (error) {
            this.showToast('Error', error?.body?.message ?? 'Failed to load orders.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // ── Platform event ──

    subscribeToEvent() {
        subscribe(CHANNEL, -1, () => {
            this.loadOrders();
        }).then(response => {
            this.subscription = response;
        });

        onError(error => {
            console.error('[kitchenOrdersTKR] EMP API error:', JSON.stringify(error));
        });
    }

    // ── Status change handler ──

    async handleStatusChange(event) {
        const orderId   = event.currentTarget.dataset.orderId;
        const newStatus = event.currentTarget.dataset.newStatus;

        // Cancel needs a confirm step — show the inline panel instead of calling Apex
        if (newStatus === 'Cancelled') {
            this.confirmingCancelId = orderId;
            this.cancelReason = '';
            return;
        }

        this.isUpdating = true;
        try {
            await updateOrderStatus({ orderId, newStatus, reason: null });
            await this.loadOrders();
        } catch (error) {
            this.showToast('Error', error?.body?.message ?? 'Failed to update order.', 'error');
        } finally {
            this.isUpdating = false;
        }
    }

    // ── Cancel confirm handlers ──

    handleCancelReasonChange(event) {
        this.cancelReason = event.target.value;
    }

    async handleConfirmCancel(event) {
        const orderId = event.currentTarget.dataset.orderId;
        this.isUpdating = true;
        try {
            await updateOrderStatus({ orderId, newStatus: 'Cancelled', reason: this.cancelReason });
            this.confirmingCancelId = null;
            this.cancelReason = '';
            await this.loadOrders();
        } catch (error) {
            this.showToast('Error', error?.body?.message ?? 'Failed to cancel order.', 'error');
        } finally {
            this.isUpdating = false;
        }
    }

    handleBackFromCancel() {
        this.confirmingCancelId = null;
        this.cancelReason = '';
    }

    // ── Misc ──

    handleRefresh() {
        this.loadOrders();
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
