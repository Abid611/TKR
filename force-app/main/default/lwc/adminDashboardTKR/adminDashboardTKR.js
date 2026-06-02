import { LightningElement } from 'lwc';

const TAB      = 'tab-btn';
const TAB_ON   = 'tab-btn active';

export default class AdminDashboardTKR extends LightningElement {
    activePeriod = 'TODAY';

    get dailyTabClass()   { return this.activePeriod === 'TODAY'     ? TAB_ON : TAB; }
    get weeklyTabClass()  { return this.activePeriod === 'THIS_WEEK' ? TAB_ON : TAB; }
    get allTimeTabClass() { return this.activePeriod === 'ALL_TIME'  ? TAB_ON : TAB; }

    handleTabClick(event) {
        this.activePeriod = event.currentTarget.dataset.period;
    }
}
