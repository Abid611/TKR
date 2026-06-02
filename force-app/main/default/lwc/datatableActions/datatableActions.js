import { LightningElement,wire, api , track} from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import updateAccounts from '@salesforce/apex/AccountController.updateAccounts'
import { refreshApex } from '@salesforce/apex';
export default class DatatableActions extends LightningElement {

    @track accounts;
    @track draftValues=[];
    wiredAccountsResult;
    columns = [
        {label: 'Name', fieldName: 'Name', editable: true},
        {label: 'Phone', fieldName: 'Phone', editable: true},
        {
            type: 'button',
            typeAttributes: {
                label: 'Edit',
                name: 'edit',
                varient: 'brand'
            }
        }
    ];

    @wire(getAccounts)
    wiredAccounts(result){
        this.wiredAccountsResult = result;
        if(result.data){
            this.accounts = result.data;
        }
    }
    async handleSave(event){
        const updatedFields = event.detail.draftValues;
        try{
            await updateAccounts({data: updatedFields});
            this.draftValues = [];
            await refreshApex(this.wiredAccountsResult)
        }
        catch(error){
            console.error(error);
        }
    }
}