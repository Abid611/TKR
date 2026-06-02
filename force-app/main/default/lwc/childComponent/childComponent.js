import { LightningElement, api,track} from 'lwc';
export default class ChildComponent extends LightningElement {
    @api parentData;
    @track dataSendToChild;
    handleInputTextChange(event){
        this.dataSendToChild = event.target.value;
        this.sendDataToParent();
    }
    sendDataToParent(){
        console.log('Dispatching event with:', this.dataSendToChild);
        const event = new CustomEvent('send',{
        detail: {message: this.dataSendToChild}
        });
        this.dispatchEvent(event);
    }
    
}