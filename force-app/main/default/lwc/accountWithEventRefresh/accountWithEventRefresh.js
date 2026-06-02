import { LightningElement, track } from 'lwc';
import getAccountDetails from '@salesforce/apex/getAccountDetails.getAccountDetailsForPlatformEventComp';
import { subscribe, onError, setDebugFlag  } from 'lightning/empApi';
export default class AccountWithEventRefresh extends LightningElement {
    @track Account = [];
    subscription = null;
    columns=[
        {label: 'Name', fieldName: 'Name'},
        {label: 'Phone', fieldName: 'Phone'},
        {label: 'Type' , fieldName: 'Type'},
        {label: 'Industry', fieldName: 'Industry'}
    ];
    connectedCallback(){
        this.loadAccounts();
        this.subscribToPlatformEvent();
        setDebugFlag(true);
    }
    loadAccounts(){
        getAccountDetails()
        .then(result =>{
            this.Account = result;
            //console.log('Acccounts Data is: ', JSON.stringify(this.Account));
        })
        .catch(error =>{
            console.error(error);
        });
    }
    subscribToPlatformEvent(){
        const channel = '/event/Account_Dashboard_Event__e';
        subscribe(channel, -2, event =>{
            this.loadAccounts();
        })
        .then(response =>{
            this.subscription = response;
        });

        onError(error => {
            console.error('Platform Event Error: ', error);
        });
    }

}