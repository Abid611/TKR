import { LightningElement,api, wire } from 'lwc';
import getAccountDetails from '@salesforce/apex/getAccountDetails.getAccountDetailsOnly';
export default class AccountDetailsComponent extends LightningElement {
    @api recordId;

    account;
    contacts = [];
    opportunities = [];
    cases = [];

    contactColumns = [
        {label: 'Name', fieldName: 'Name'},
        {label: 'Email', fieldName: 'Email'},
        {label: 'Phone', fieldName: 'Phone'}
    ];
    opportunityColumns = [
        {label: 'Name' , fieldName : 'Name'},
        {label: 'Stage', fieldName : 'Stage'},
        {label: 'Amount', fieldName : 'Amount'}
    ];
    caseColumns = [
        {label: 'Case Number', fieldName: 'CaseNumber'},
        {label: 'Subject', fieldName: 'Subject'},
        {label: 'Status', fieldName: 'Status'}
    ];


    @wire(getAccountDetails,{accountId: '$recordId'})
    wiredData({error,data}){
        if(data){
            this.account = data.accountRecord;
            this.contacts = data.contacts;
            this.opportunities = data.opportunities;
            this.cases = data.cases;
        }else if(error){
            console.error(error);
        }
    }
}