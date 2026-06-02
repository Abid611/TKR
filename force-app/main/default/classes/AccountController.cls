public class AccountController {

	@AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Id, Name, Phone, Industry
            FROM Account
            LIMIT 50
        ];
    }

    @AuraEnabled
    public static void updateAccounts(List<Account> data) {
        update data;
    }

}