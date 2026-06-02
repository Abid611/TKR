/**
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 * Class Name      : OrderController
 * Author          : Abid
 * Created Date    : May 26, 2026
 * Last Modified By: Abid
 * Last Modified On: May 26, 2026
 * Description     : AuraEnabled controller for guest customer ordering on the
 *                   TKR restaurant Experience Cloud site. Creates Order__c and
 *                   Order_Item__c records in a single transaction and returns
 *                   the auto-number order name for the confirmation screen.
 *
 * Change History  :
 *  Date           │ Author │ Change
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 *  May 26, 2026  │ Abid   │ Initial version
 * ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
 */

// without sharing: guest users on Experience Cloud have no sharing context.
// Scope is intentionally limited to insert-only order creation.
public without sharing class OrderController {

    /**
     * Places a new order for a guest customer in a single transaction.
     * Creates one Order__c and one Order_Item__c per cart item.
     *
     * @param tableNumber Table where the order should be delivered (max 10 chars)
     * @param notes       Special instructions from the customer
     * @param itemsJson   JSON array of { menuItemId, quantity, price }
     * @return            Auto-number Order Name (e.g. O-0000000001) for the confirmation screen
     * @throws AuraHandledException on validation failure or DML error
     */
    @AuraEnabled
    public static String placeOrder(String tableNumber, String notes, String itemsJson) {
        try {
            if (String.isBlank(itemsJson)) {
                throw new AuraHandledException('Your cart is empty. Please add items before placing an order.');
            }

            List<OrderItemRequest> requestItems = (List<OrderItemRequest>) JSON.deserialize(
                itemsJson,
                List<OrderItemRequest>.class
            );

            if (requestItems == null || requestItems.isEmpty()) {
                throw new AuraHandledException('Your cart is empty. Please add items before placing an order.');
            }

            Decimal totalAmount = 0;
            for (OrderItemRequest item : requestItems) {
                totalAmount += item.price * item.quantity;
            }

            Order__c order = new Order__c(
                Status__c      = 'New',
                Order_Time__c  = DateTime.now(),
                Table_Number__c = tableNumber,
                Notes__c       = notes,
                Total_Amount__c = totalAmount
            );
            insert order;

            List<Order_Item__c> orderItems = new List<Order_Item__c>();
            for (OrderItemRequest item : requestItems) {
                orderItems.add(new Order_Item__c(
                    Order__c     = order.Id,
                    Menu_Item__c = item.menuItemId,
                    Quantity__c  = item.quantity,
                    Price__c     = item.price
                ));
            }
            insert orderItems;

            EventBus.publish(new Order_Status_Event__e(Order_Id__c = order.Id));

            return [SELECT Name FROM Order__c WHERE Id = :order.Id LIMIT 1].Name;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to place your order. Please try again.');
        }
    }

    /**
     * DTO representing a single cart item sent from the LWC.
     */
    public class OrderItemRequest {
        @AuraEnabled public Id      menuItemId;
        @AuraEnabled public Integer quantity;
        @AuraEnabled public Decimal price;
    }

    /**
     * Retrieves order details for a guest customer by order number.
     * Used by the myOrdersTKR tracking page — no login required.
     *
     * @param orderNumber The auto-number order name (e.g. O-0000000001)
     * @return            OrderSummaryWrapper containing status, items, and total
     * @throws AuraHandledException if the order number is blank or not found
     */
    @AuraEnabled
    public static OrderSummaryWrapper getOrderByNumber(String orderNumber) {
        if (String.isBlank(orderNumber)) {
            throw new AuraHandledException('Please enter an order number.');
        }

        String trimmed = orderNumber.trim().toUpperCase();

        List<Order__c> orders = [
            SELECT Name, Status__c, Table_Number__c, Notes__c, Total_Amount__c, Order_Time__c,
                   (SELECT Menu_Item__r.Name, Quantity__c, Price__c
                    FROM Order_Items__r
                    ORDER BY CreatedDate ASC)
            FROM Order__c
            WHERE Name = :trimmed
            LIMIT 1
        ];

        if (orders.isEmpty()) {
            throw new AuraHandledException('Order not found. Please check the order number and try again.');
        }

        Order__c order = orders[0];
        OrderSummaryWrapper wrapper = new OrderSummaryWrapper();
        wrapper.orderId     = order.Id;
        wrapper.orderName   = order.Name;
        wrapper.status      = order.Status__c;
        wrapper.tableNumber = order.Table_Number__c;
        wrapper.notes       = order.Notes__c;
        wrapper.totalAmount = order.Total_Amount__c ?? 0;
        wrapper.orderTime   = order.Order_Time__c;

        wrapper.items = new List<OrderItemSummary>();
        for (Order_Item__c item : order.Order_Items__r) {
            OrderItemSummary summary = new OrderItemSummary();
            summary.menuItemName = item.Menu_Item__r?.Name ?? 'Unknown Item';
            summary.quantity     = item.Quantity__c != null ? Integer.valueOf(item.Quantity__c) : 0;
            summary.price        = item.Price__c ?? 0;
            wrapper.items.add(summary);
        }

        return wrapper;
    }

    /**
     * Returns all active (non-Delivered, non-Cancelled) orders for the kitchen queue,
     * ordered oldest-first so the most urgent orders surface at the top.
     *
     * @return List of OrderSummaryWrapper records
     */
    @AuraEnabled
    public static List<OrderSummaryWrapper> getActiveOrders() {
        List<Order__c> orders = [
            SELECT Id, Name, Status__c, Table_Number__c, Notes__c, Total_Amount__c, Order_Time__c,
                   (SELECT Menu_Item__r.Name, Quantity__c, Price__c
                    FROM Order_Items__r
                    ORDER BY CreatedDate ASC)
            FROM Order__c
            WHERE Status__c NOT IN ('Delivered', 'Cancelled')
            ORDER BY Order_Time__c ASC
            LIMIT 200
        ];

        List<OrderSummaryWrapper> results = new List<OrderSummaryWrapper>();
        for (Order__c order : orders) {
            OrderSummaryWrapper wrapper = new OrderSummaryWrapper();
            wrapper.orderId     = order.Id;
            wrapper.orderName   = order.Name;
            wrapper.status      = order.Status__c;
            wrapper.tableNumber = order.Table_Number__c;
            wrapper.notes       = order.Notes__c;
            wrapper.totalAmount = order.Total_Amount__c ?? 0;
            wrapper.orderTime   = order.Order_Time__c;

            wrapper.items = new List<OrderItemSummary>();
            for (Order_Item__c item : order.Order_Items__r) {
                OrderItemSummary summary = new OrderItemSummary();
                summary.menuItemName = item.Menu_Item__r?.Name ?? 'Unknown Item';
                summary.quantity     = item.Quantity__c != null ? Integer.valueOf(item.Quantity__c) : 0;
                summary.price        = item.Price__c ?? 0;
                wrapper.items.add(summary);
            }
            results.add(wrapper);
        }
        return results;
    }

    /**
     * Updates the status of an order and publishes Order_Status_Event__e so all
     * subscribed components (kitchen queue, customer tracking) refresh in real time.
     *
     * @param orderId   Id of the Order__c to update
     * @param newStatus Target status — one of: Accepted, Preparing, Ready, Delivered, Cancelled
     * @throws AuraHandledException on invalid input or DML failure
     */
    @AuraEnabled
    public static void updateOrderStatus(Id orderId, String newStatus, String reason) {
        if (orderId == null) {
            throw new AuraHandledException('Order ID is required.');
        }

        Set<String> validStatuses = new Set<String>{
            'Accepted', 'Preparing', 'Ready', 'Delivered', 'Cancelled'
        };
        if (!validStatuses.contains(newStatus)) {
            throw new AuraHandledException('Invalid status value.');
        }

        List<Order__c> orders = [SELECT Id, Status__c FROM Order__c WHERE Id = :orderId LIMIT 1];
        if (orders.isEmpty()) {
            throw new AuraHandledException('Order not found.');
        }

        try {
            orders[0].Status__c = newStatus;
            if (newStatus == 'Cancelled' && !String.isBlank(reason)) {
                orders[0].Cancellation_Reason__c = reason;
            }
            update orders[0];
            EventBus.publish(new Order_Status_Event__e(Order_Id__c = orderId));
        } catch (Exception e) {
            throw new AuraHandledException('Unable to update order status. Please try again.');
        }
    }

    /**
     * Returns aggregate dashboard statistics for the admin dashboard.
     *
     * @param period Time period: 'TODAY', 'THIS_WEEK', or 'ALL_TIME'
     * @return DashboardStatsWrapper containing order counts, revenue, status breakdown, and top items
     */
    @AuraEnabled(cacheable=true)
    public static DashboardStatsWrapper getDashboardStats(String period) {
        try {
            String validated      = validatePeriod(period);
            String dateFilter     = buildOrderDateFilter(validated);
            String itemDateFilter = buildItemDateFilter(validated);

            String mainQuery = 'SELECT COUNT(Id) totalOrders, SUM(Total_Amount__c) totalRevenue, AVG(Total_Amount__c) avgOrderValue FROM Order__c' + dateFilter;
            List<AggregateResult> mainAgg = Database.query(mainQuery, AccessLevel.USER_MODE);

            String statusQuery = 'SELECT Status__c, COUNT(Id) cnt FROM Order__c' + dateFilter + ' GROUP BY Status__c';
            List<AggregateResult> statusAgg = Database.query(statusQuery, AccessLevel.USER_MODE);

            String itemQuery = 'SELECT Menu_Item__r.Name menuName, SUM(Quantity__c) totalQty FROM Order_Item__c' + itemDateFilter + ' GROUP BY Menu_Item__r.Name ORDER BY SUM(Quantity__c) DESC LIMIT 5';
            List<AggregateResult> itemAgg = Database.query(itemQuery, AccessLevel.USER_MODE);

            DashboardStatsWrapper wrapper = new DashboardStatsWrapper();

            if (!mainAgg.isEmpty()) {
                wrapper.totalOrders = (Integer)(mainAgg[0].get('totalOrders') ?? 0);
                Decimal rev = (Decimal) mainAgg[0].get('totalRevenue');
                wrapper.totalRevenue = rev?.setScale(2) ?? 0;
                Decimal avg = (Decimal) mainAgg[0].get('avgOrderValue');
                wrapper.avgOrderValue = avg?.setScale(2) ?? 0;
            }

            wrapper.statusBreakdown = new List<StatusCountWrapper>();
            for (AggregateResult ar : statusAgg) {
                StatusCountWrapper scw = new StatusCountWrapper();
                scw.status = (String)  ar.get('Status__c');
                scw.count  = (Integer) ar.get('cnt');
                wrapper.statusBreakdown.add(scw);
            }

            wrapper.topItems = new List<TopItemWrapper>();
            for (AggregateResult ar : itemAgg) {
                TopItemWrapper tiw = new TopItemWrapper();
                tiw.name     = (String) ar.get('menuName');
                Decimal qty  = (Decimal) ar.get('totalQty');
                tiw.totalQty = qty != null ? qty.intValue() : 0;
                wrapper.topItems.add(tiw);
            }

            return wrapper;
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to load dashboard statistics.');
        }
    }

    /**
     * Returns all orders for the admin view, filtered by time period.
     *
     * @param period Time period: 'TODAY', 'THIS_WEEK', or 'ALL_TIME'
     * @return List of AdminOrderWrapper records ordered newest first
     */
    @AuraEnabled(cacheable=true)
    public static List<AdminOrderWrapper> getAllOrders(String period) {
        try {
            String validated  = validatePeriod(period);
            String dateFilter = buildOrderDateFilter(validated);

            String query = 'SELECT Id, Name, Status__c, Table_Number__c, Notes__c, Total_Amount__c, Order_Time__c FROM Order__c' + dateFilter + ' ORDER BY Order_Time__c DESC LIMIT 500';
            List<Order__c> orders = Database.query(query, AccessLevel.SYSTEM_MODE);

            List<AdminOrderWrapper> results = new List<AdminOrderWrapper>();
            for (Order__c order : orders) {
                AdminOrderWrapper w = new AdminOrderWrapper();
                w.orderId     = order.Id;
                w.orderName   = order.Name;
                w.status      = order.Status__c;
                w.tableNumber = order.Table_Number__c;
                w.notes       = order.Notes__c;
                w.totalAmount = order.Total_Amount__c ?? 0;
                w.orderTime   = order.Order_Time__c;
                results.add(w);
            }
            return results;
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to load orders.');
        }
    }

    /**
     * Returns all menu items including unavailable ones for the admin menu management panel.
     *
     * @return List of Menu_Item__c records ordered by category then name
     */
    @AuraEnabled(cacheable=true)
    public static List<Menu_Item__c> getAllMenuItems() {
        try {
            return [
                SELECT Id, Name, Category__c, Price__c, Available__c, Description__c
                FROM Menu_Item__c
                WITH USER_MODE
                ORDER BY Category__c ASC, Name ASC
                LIMIT 200
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Failed to load menu items.');
        }
    }

    /**
     * Sets the availability of a menu item.
     *
     * @param menuItemId Id of the Menu_Item__c to update
     * @param available  New availability value
     * @throws AuraHandledException on invalid input or DML failure
     */
    @AuraEnabled
    public static void setMenuItemAvailability(Id menuItemId, Boolean available) {
        if (menuItemId == null) {
            throw new AuraHandledException('Menu item ID is required.');
        }
        try {
            List<Menu_Item__c> items = [
                SELECT Id, Available__c FROM Menu_Item__c WHERE Id = :menuItemId LIMIT 1
            ];
            if (items.isEmpty()) {
                throw new AuraHandledException('Menu item not found.');
            }
            items[0].Available__c = available;
            update items[0];
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update menu item availability.');
        }
    }

    private static String validatePeriod(String period) {
        Set<String> validPeriods = new Set<String>{ 'TODAY', 'THIS_WEEK', 'ALL_TIME' };
        if (String.isBlank(period) || !validPeriods.contains(period)) {
            return 'TODAY';
        }
        return period;
    }

    private static String buildOrderDateFilter(String period) {
        if (period == 'TODAY')     return ' WHERE Order_Time__c = TODAY';
        if (period == 'THIS_WEEK') return ' WHERE Order_Time__c = THIS_WEEK';
        return '';
    }

    private static String buildItemDateFilter(String period) {
        if (period == 'TODAY')     return ' WHERE Order__r.Order_Time__c = TODAY';
        if (period == 'THIS_WEEK') return ' WHERE Order__r.Order_Time__c = THIS_WEEK';
        return '';
    }

    /** Wrapper returned to the order-tracking LWC. */
    public class OrderSummaryWrapper {
        @AuraEnabled public Id                orderId;
        @AuraEnabled public String            orderName;
        @AuraEnabled public String            status;
        @AuraEnabled public String            tableNumber;
        @AuraEnabled public String            notes;
        @AuraEnabled public Decimal           totalAmount;
        @AuraEnabled public DateTime          orderTime;
        @AuraEnabled public List<OrderItemSummary> items;
    }

    /** One line item within an OrderSummaryWrapper. */
    public class OrderItemSummary {
        @AuraEnabled public String  menuItemName;
        @AuraEnabled public Integer quantity;
        @AuraEnabled public Decimal price;
    }

    /** Aggregate stats for the admin dashboard overview section. */
    public class DashboardStatsWrapper {
        @AuraEnabled public Integer                  totalOrders;
        @AuraEnabled public Decimal                  totalRevenue;
        @AuraEnabled public Decimal                  avgOrderValue;
        @AuraEnabled public List<StatusCountWrapper> statusBreakdown;
        @AuraEnabled public List<TopItemWrapper>     topItems;
    }

    /** Status + order count pair for the status breakdown panel. */
    public class StatusCountWrapper {
        @AuraEnabled public String  status;
        @AuraEnabled public Integer count;
    }

    /** Top-selling menu item for the top items panel. */
    public class TopItemWrapper {
        @AuraEnabled public String  name;
        @AuraEnabled public Integer totalQty;
    }

    /** Flat order record for the admin orders datatable. */
    public class AdminOrderWrapper {
        @AuraEnabled public Id       orderId;
        @AuraEnabled public String   orderName;
        @AuraEnabled public String   status;
        @AuraEnabled public String   tableNumber;
        @AuraEnabled public String   notes;
        @AuraEnabled public Decimal  totalAmount;
        @AuraEnabled public DateTime orderTime;
    }
}
