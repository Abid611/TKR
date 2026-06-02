import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllMenuItems from '@salesforce/apex/OrderController.getAllMenuItems';
import setMenuItemAvailability from '@salesforce/apex/OrderController.setMenuItemAvailability';

const COLUMNS = [
    {
        label: 'Name', fieldName: 'recordUrl', type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
    },
    { label: 'Category', fieldName: 'Category__c', type: 'text',     initialWidth: 120 },
    {
        label: 'Price', fieldName: 'Price__c', type: 'currency',
        typeAttributes: { currencyCode: 'USD', minimumFractionDigits: 2 },
        initialWidth: 110
    },
    { label: 'Available', fieldName: 'Available__c', type: 'boolean', editable: true, initialWidth: 110 }
];

export default class AdminMenuTKR extends LightningElement {
    columns = COLUMNS;
    @track draftValues = [];
    menuItems = [];
    wiredMenuResult;

    @wire(getAllMenuItems)
    wiredMenu(result) {
        this.wiredMenuResult = result;
        if (result.data) {
            this.menuItems = result.data.map(item => ({
                ...item,
                recordUrl: `/lightning/r/Menu_Item__c/${item.Id}/view`
            }));
        }
    }

    get isLoading(){ return !this.wiredMenuResult || (!this.wiredMenuResult.data && !this.wiredMenuResult.error); }
    get hasError() { return !!this.wiredMenuResult?.error; }
    get hasData()  { return !!this.wiredMenuResult?.data; }

    async handleSave(event) {
        const draftValues = event.detail.draftValues;
        try {
            await Promise.all(
                draftValues.map(draft =>
                    setMenuItemAvailability({ menuItemId: draft.Id, available: draft.Available__c })
                )
            );
            this.draftValues = [];
            await refreshApex(this.wiredMenuResult);
            this.showToast('Success', 'Availability updated.', 'success');
        } catch (error) {
            this.showToast('Error', error?.body?.message ?? 'Failed to update availability.', 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
