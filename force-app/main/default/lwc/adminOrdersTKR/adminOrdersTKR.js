import { LightningElement, api, wire } from 'lwc';
import getAllOrders from '@salesforce/apex/OrderController.getAllOrders';

const COLUMNS = [
    { label: 'Order #',    fieldName: 'orderName',   type: 'text',     initialWidth: 130 },
    { label: 'Status',     fieldName: 'status',       type: 'text',     initialWidth: 110 },
    { label: 'Table',      fieldName: 'tableNumber',  type: 'text',     initialWidth: 90  },
    {
        label: 'Total', fieldName: 'totalAmount', type: 'currency',
        typeAttributes: { currencyCode: 'USD', minimumFractionDigits: 2 },
        initialWidth: 120
    },
    {
        label: 'Order Time', fieldName: 'orderTime', type: 'date',
        typeAttributes: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        initialWidth: 190
    },
    { label: 'Notes', fieldName: 'notes', type: 'text', wrapText: true }
];

export default class AdminOrdersTKR extends LightningElement {
    @api period;
    columns = COLUMNS;

    @wire(getAllOrders, { period: '$period' })
    wiredOrders;

    get orders()   { return this.wiredOrders?.data ?? []; }
    get isLoading(){ return !this.wiredOrders || (!this.wiredOrders.data && !this.wiredOrders.error); }
    get hasError() {
        if (this.wiredOrders?.error) console.log('wired order has error: ', JSON.stringify(this.wiredOrders.error));
        return !!this.wiredOrders?.error;
    }
    get hasData()  { return !!this.wiredOrders?.data; }
    get isEmpty()  { return this.orders.length === 0; }
}
