/**
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 * Class Name      : getAccountDetails
 * Author          : Abid
 * Created Date    : May 2, 2026
 * Last Modified By: Abid
 * Last Modified On: May 2, 2026
 * Description     : This class implements to show Account and their child records in lwc.
 *  
 * Change History  :
 *  Date          │   Author     │   Change
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 *  May 2, 2026  │ Abid   │ Initial version
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 */

public class getAccountDetails {

	@AuraEnabled(cacheable=true)
	public static AccountWrapper getAccountDetailsOnly(Id accountId){

		Account acc = [
			SELECT Id, Name, Phone, Industry, Type, Website,Total_Opportunity__c
			FROM ACCOUNT
			WHERE Id =: accountId
			LIMIT 1
		];

		List<Contact> contacts = [
			SELECT Id, Name, Email, Phone
			FROM Contact
			WHERE AccountId =: accountId
		];

		List<Opportunity> opps = [
			SELECT Id, Name, StageName, Amount 
			FROM Opportunity 
			WHERE AccountId =: accountId
		];

		List<Case> cases = [
			SELECT Id, CaseNumber, Subject, status
			FROM Case
			Where AccountId =: accountId
		];

		return new AccountWrapper(acc, contacts, opps, cases);
	}
	public class AccountWrapper {
		@AuraEnabled public Account accountRecord;
		@AuraEnabled public List<Contact> contacts;
		@AuraEnabled public List<Opportunity> opportunities;
		@AuraEnabled public List<Case> cases;

		public AccountWrapper(Account a, List<Contact> c, List<Opportunity> o, List<Case> cs){
			accountRecord = a;
			contacts = c;
			opportunities = o;
			cases = cs;
		}
	}

	@AuraEnabled(cacheable=false)
	public static List<Account> getAccountDetailsForPlatformEventComp(){
		return [SELECT Id, Name, Phone, Industry, Type
				FROM Account
				ORDER BY LastModifiedDate DESC
				LIMIT 50
				];
	}

}