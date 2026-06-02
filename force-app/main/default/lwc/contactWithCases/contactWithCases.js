import { LightningElement, api, wire } from 'lwc';
import getContactCases from '@salesforce/apex/contactDetails.getRelatedCases';
export default class ContactWithCases extends LightningElement {    

    @api recordId;

    casesColumns = [
        {label : 'Case Number', fieldName : 'caseUrl', type : 'url',
            typeAttributes: {
                label: { fieldName : 'CaseNumber'}, target: '_blank'
            }
        },
        {label : 'Origin', fieldName : 'Origin'},
        {label : 'Status', fieldName : 'Status'}
    ];
    cases;

    @wire(getContactCases, {contactId: '$recordId'})
    wiredData({data,error}){
        if(data){
            this.cases = data.cases.map(c => ({
                ...c, 
                caseUrl: '/'+ c.Id
            }));
        }else if(error){
            console.error(error);
        }
    }
    

}