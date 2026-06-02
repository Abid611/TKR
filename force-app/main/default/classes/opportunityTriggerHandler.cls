/**
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 * Class Name      : opportunityTriggerHandler
 * Author          : <YourName>
 * Created Date    : May 3, 2026
 * Last Modified By: <YourName>
 * Last Modified On: May 3, 2026
 * Description     : This class implements for......
 *  
 * Change History  :
 *  Date          │   Author     │   Change
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 *  May 3, 2026  │ <YourName>   │ Initial version
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 */

public class opportunityTriggerHandler {

	public static void handleAfterInsert(List<Opportunity> newOpp) {
		Set<Id> accountsId = new Set<Id>();
		for(Opportunity copp: newOpp){
			if(copp.AccountId != null){
				accountsId.add(copp.AccountId);
			}
		}
		if(!accountsId.isEmpty()){
			//updateAccountTotalCountUsingAggregate(accountsId);
			updateAccountTotalCountUsingMap(accountsId);
		}	
	}
	public static void handleAfterUpdate(List<Opportunity> newOpp, Map<Id,Opportunity> oldOppMap){
		Set<Id> accountsId = new Set<Id>();
		for(Opportunity opp: newOpp){
			Opportunity oldOpp = oldOppMap.get(opp.Id);
			if(opp.AccountId != oldOpp.AccountId || opp.StageName != oldOpp.StageName ){
				accountsId.add(opp.AccountId);
				accountsId.add(oldOpp.AccountId);
			}
		}
		if(!accountsId.isEmpty()){
			system.debug('update count method calling');
			//updateAccountTotalCountUsingAggregate(accountsId);
			updateAccountTotalCountUsingMap(accountsId);
		}
	}
	public static void updateAccountTotalCountUsingAggregate(Set<Id> accountsId){
		Map<Id,Decimal> accountOpportunityMap = new Map<Id,Decimal>();
		for(AggregateResult agr: [
			SELECT Count(Id) opp, AccountId acc FROM OPPORTUNITY 
			WHERE AccountId IN: accountsId
			AND StageName NOT IN ('Closed Won', 'Closed Lost')
			GROUP BY AccountId
		]){
			accountOpportunityMap.put(
				(Id) agr.get('acc'),
				(Decimal) agr.get('opp')
			);
		}
		List<Account> accountsToUpdate = new List<Account>();
		for(Id cId: accountOpportunityMap.keySet()){
			if(accountOpportunityMap.containsKey(cId)){
				Account acc = new Account(
					Id = cId,
					Total_Opportunity__c = accountOpportunityMap.containsKey(cId) ? accountOpportunityMap.get(cId) : 0
				);
				accountsToUpdate.add(acc);
			}
		}
		update accountsToUpdate;
	}
	public static void updateAccountTotalCountUsingMap(Set<Id> accountsId){

		Map<Id,Decimal> accountOppCount = new Map<Id,Decimal>();
		List<Opportunity> opportunitiesList = [
			SELECT Id,AccountId,StageName From Opportunity 
			WHERE AccountId IN: accountsId
			AND StageName NOT IN ('Closed Won','Closed Lost')
		];
		for(Opportunity opp: opportunitiesList){
			if(accountOppCount.containsKey(opp.AccountId)){
				decimal count = accountOppCount.get(opp.AccountId);
				count++;
				accountOppCount.put(opp.AccountId, count);
			}else{
				decimal count = 1;
				accountOppCount.put(opp.AccountId, count);
			}
		}
		List<Account> accountsToUpdate = new List<Account>();
		for(Id thisAccountId: accountOppCount.keySet()){
			Account acc = new Account();
			acc.Id = thisAccountId;
			acc.Total_Opportunity__c = accountOppCount.containsKey(thisAccountId) ? accountOppCount.get(thisAccountId) : 0;
			accountsToUpdate.add(acc);
		}
		if(!accountsToUpdate.isEmpty()){
			update accountsToUpdate;
		}
	}

}