trigger opportunityTrigger on Opportunity(after insert, after update, after delete, after undelete) {
	
	if(Trigger.isAfter && Trigger.isInsert){
		opportunityTriggerHandler.handleAfterInsert(Trigger.New);
	}
	if(Trigger.isAfter && Trigger.isUpdate){
		opportunityTriggerHandler.handleAfterUpdate(Trigger.New, Trigger.OldMap);
	}
}