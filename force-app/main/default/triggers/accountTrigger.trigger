trigger accountTrigger on Account(before insert, before update, before delete, after insert, after update, after delete, after undelete) {
	List<Account_Dashboard_Event__e> eventList = new List<Account_Dashboard_Event__e>();
	if(Trigger.isInsert && Trigger.isAfter){
		for(Account acc: Trigger.New){
			eventList.add(new Account_Dashboard_Event__e(
				Account_Id__c = acc.Id
			));
		}
	}
	//system.debug('my PE list: --------------'+eventList);
	EventBus.publish(eventList);
}