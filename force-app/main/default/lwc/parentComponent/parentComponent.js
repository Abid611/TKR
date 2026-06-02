import { LightningElement, track } from 'lwc';
export default class ParentComponent extends LightningElement {
    @track dataSendToChild;
    @track dataComeFromChild;
    inputChangeHandler(event){
        this.dataSendToChild = event.target.value;
    }
    handleChildData(event){
        this.dataComeFromChild = event.detail.message;
        console.log('Data come from child: ', this.dataComeFromChild);
    }

}