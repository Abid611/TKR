import { LightningElement, api, wire } from 'lwc';
import getDashboardStats from '@salesforce/apex/OrderController.getDashboardStats';

const STATUS_COLORS = {
    New:       '#0176d3',
    Accepted:  '#f4a423',
    Preparing: '#9b59b6',
    Ready:     '#27ae60',
    Delivered: '#718096',
    Cancelled: '#c0392b'
};

const CURRENCY_FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default class AdminStatsTKR extends LightningElement {
    @api period;

    @wire(getDashboardStats, { period: '$period' })
    wiredStats;

    get stats()    { return this.wiredStats?.data; }
    get isLoading(){ return !this.wiredStats || (!this.wiredStats.data && !this.wiredStats.error); }
    get hasError() { return !!this.wiredStats?.error; }
    get hasData()  { return !!this.wiredStats?.data; }

    get formattedRevenue() {
        return this.stats?.totalRevenue != null ? CURRENCY_FMT.format(this.stats.totalRevenue) : '$0.00';
    }

    get formattedAvg() {
        return this.stats?.avgOrderValue != null ? CURRENCY_FMT.format(this.stats.avgOrderValue) : '$0.00';
    }

    get statusBreakdownDisplay() {
        return (this.stats?.statusBreakdown ?? []).map(item => ({
            ...item,
            style: `background-color: ${STATUS_COLORS[item.status] ?? '#888'}; color: #fff;`
        }));
    }

    get hasStatusData() { return this.statusBreakdownDisplay.length > 0; }

    get topItemsDisplay() {
        return (this.stats?.topItems ?? []).map((item, idx) => ({ ...item, rank: idx + 1 }));
    }

    get hasTopItems() { return this.topItemsDisplay.length > 0; }
}
