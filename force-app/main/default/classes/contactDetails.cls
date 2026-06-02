public class contactDetails {

	@AuraEnabled(cacheable=true)
	public static ContactWrapper getRelatedCases(Id contactId) {
		List<Case> relatedCases = [
			SELECT Id, CaseNumber, Status, Origin
			FROM CASE
			WHERE ContactId =: contactId
		];
		return new ContactWrapper(relatedCases);
	}
	public class ContactWrapper{
		@AuraEnabled public List<case> cases;

		public ContactWrapper(List<case> c){
			cases = c;
		}
	}

}