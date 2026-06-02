public class codeStorage {

	/*

	import { LightningElement,wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

const GET_MENU_ITEMS = gql`
query{
    uiapi{
        query{
            Menu_Item__c(first:50){
                edges{      
                    node {
                            Id
                            Name { value }
                            Price__c { value }
                            Category__c { value }
                    }
                }
            }
        }
    }
}
`;
export default class MenuTKR extends LightningElement {

menuItems=[];

@wire(graphql, {query: GET_MENU_ITEMS})
wiredMenu({data,errors}){
    if(data){
        console.log('GraphQL Data: ', JSON.stringify(data));
        this.menuItems = data.uiapi.query.Menu_Item__c.edges.map((edges) => edges.node);
    }
    if(errors){
        console.log('Error in GraphQL: ', errors);
    }
}
get menuHasItem(){
    return this.menuItems && this.menuItems.length > 0;
}
getImage(category){
    const  map = {
        'Veg': 'https://images.pexels.com/photos/28445830/pexels-photo-28445830.jpeg',
        'Non-Veg' : 'https://images.pexels.com/photos/28445830/pexels-photo-28445830.jpeg',
        'Drinks' : 'https://images.pexels.com/photos/28445830/pexels-photo-28445830.jpeg',
        'Desserts' : 'https://images.pexels.com/photos/28445830/pexels-photo-28445830.jpeg',
        'Combo': 'https://images.pexels.com/photos/28445830/pexels-photo-28445830.jpeg'
    };
    return map[category];
}

}*/

/*
	<template>
    <div class="container">

        <template if:true={menuHasItem}>
            <div class="grid">
                <template for:each={menuItems} for:item="item">
                    <div key={item.Id} class="card">
                        <img src={getImage(item.Category__c.value)} alt="Food" />
                        <div class="card-body">
                            <h3> {item.Name.value} </h3>
                            <p> {item.Category__c.value} </p>
                            <p> {item.Price__c.value} </p>
                            <lightning-button
                                label="Add to Cart"
                                variant="brand"
                                data-id={item.Id}
                                onclick={handleAddToCart}>
                            </lightning-button>
                        </div>
                    </div>
                </template>
            </div>
        </template>

    </div>
</template>

*/

}