# TKR — Restaurant Ordering System on Salesforce

A full-stack restaurant ordering app built on Salesforce Experience Cloud.
Customers browse a menu, place orders, and track status in real time.
Kitchen staff manage the live order queue. Admins monitor the full business.

---

## How It Works

There are three types of users:

| Who | How they access it | What they can do |
|---|---|---|
| Customer | Public website (no login needed) | Browse menu, place order, track order by number |
| Kitchen Staff | Inside Salesforce | See live order queue, update order status |
| Admin | Inside Salesforce | View all orders, revenue stats, manage menu |

---

## What Gets Deployed Automatically

When you follow this guide, these are created for you automatically — you do
not need to build them manually in Salesforce:

- **3 custom objects** — Menu_Item__c, Order__c, Order_Item__c
- **1 platform event** — Order_Status_Event__e (for real-time updates)
- **All custom fields** on each object
- **All Apex classes** — the backend business logic
- **All LWC components** — the frontend UI

---

## Prerequisites

You need these four things installed before starting. Click each link,
download, and install.

### 1. Node.js
Download from: https://nodejs.org (choose the LTS version)

After installing, open your terminal and verify:
```bash
node --version
```
You should see something like `v18.0.0` or higher.

### 2. Salesforce CLI
Download from: https://developer.salesforce.com/tools/salesforcecli

After installing, verify:
```bash
sf --version
```

### 3. Git
Download from: https://git-scm.com

After installing, verify:
```bash
git --version
```

### 4. A Salesforce Developer Org (Free)
Sign up at: https://developer.salesforce.com/signup

This is your permanent free Salesforce environment where the app will live.
It does not expire. Use your real email — Salesforce will send a verification.

> **Already have a Developer org?** You can use it. Just make sure it is a
> Developer Edition org, not a Trailhead Playground (Trailhead Playgrounds
> have restrictions that may cause deployment issues).

---

## Setup Guide

Follow these steps in order. Do not skip any step.

---

### Step 1 — Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/Abid611/TKR.git
cd TKR
```

This downloads all the project files to your computer and puts you inside the
project folder.

---

### Step 2 — Install Project Dependencies

```bash
npm install
```

This reads `package.json` and downloads the development tools the project
needs (ESLint, Prettier, Jest). A `node_modules` folder will appear — this is
normal and is excluded from git automatically.

---

### Step 3 — Log In to Your Salesforce Developer Org

```bash
sf org login web --alias TKR --set-default
```

A browser window will open. Log in with your Salesforce Developer org
credentials. After logging in, close the browser tab and return to the
terminal.

The `--alias TKR` gives your org a nickname so you can refer to it easily.
The `--set-default` makes it the org all future commands target by default.

---

### Step 4 — Deploy Everything to Your Org

```bash
sf project deploy start
```

This uploads everything in one command:
- All 3 custom objects and their fields
- All Apex classes (backend logic)
- All LWC components (frontend UI)
- The TKR app

This takes about 30-60 seconds. When it finishes you will see a
`Status: Succeeded` message.

---

### Step 5 — Open Your Org

```bash
sf org open
```

This opens your Salesforce Developer org in the browser and logs you in
automatically. You should see the Salesforce home page.

---

### Step 6 — Add Sample Menu Data

The database is empty after deploy. You need to add some food items so
customers have something to order.

1. Click the **App Launcher** (9 dots icon, top left)
2. Search for and open the **TKR** app
3. Click the **Menu Items** tab
4. Click **New** and create a few items:

| Name | Category | Price | Available |
|---|---|---|---|
| Chicken Burger | Non-Veg | 12.99 | ✓ |
| Veggie Pizza | Veg | 10.99 | ✓ |
| Mango Lassi | Drinks | 4.99 | ✓ |
| Chocolate Cake | Desserts | 6.99 | ✓ |
| Burger + Drink Combo | COMBOS | 15.99 | ✓ |

---

### Step 7 — Set Up the Kitchen and Admin Pages

These pages are used inside Salesforce by your kitchen staff and admin.

**Create the Kitchen page:**
1. Go to **Setup** (gear icon, top right) → **Lightning App Builder**
2. Click **New** → **App Page** → **Next**
3. Name it `Kitchen` → **Next** → choose **One Region** → **Finish**
4. In the left panel, find `kitchenOrdersTKR` under Custom components
5. Drag it onto the page canvas
6. Click **Save** → **Activate** → **Assign as Org Default** → **Save**
7. Go to **App Manager** → find **TKR** → **Edit** → add Kitchen to the nav items

**Create the Admin Dashboard page:**
1. Repeat the same steps above
2. Name it `Admin Dashboard`
3. Drag the `adminDashboardTKR` component onto the canvas
4. Save, Activate, and assign to the TKR app

---

### Step 8 — Enable Experience Cloud (Digital Experiences)

The customer-facing website runs on Salesforce Experience Cloud.

1. Go to **Setup** → search for **Digital Experiences** → click **Settings**
2. Tick **Enable Digital Experiences**
3. Click **Save**

---

### Step 9 — Create the Customer Website

1. Go to **Setup** → **Digital Experiences** → **All Sites** → **New**
2. Choose the **Build Your Own (LWR)** template → **Get Started**
3. Name it: `TKR Restaurant`
4. URL: type `restaurant` (your site will be at `.../restaurant`)
5. Click **Create**

---

### Step 10 — Build the Customer Pages in Experience Builder

Once the site is created, click **Builder** to open Experience Builder.

**Create the Menu page:**
1. Click **Pages** (top menu) → **New Page** → **Standard Page**
2. Name: `Menu` — URL: `menu` → **Create**
3. Drag the `menuTKR` component onto the page body
4. Click **Save**

**Create the Track Order page:**
1. Click **Pages** → **New Page** → **Standard Page**
2. Name: `My Order` — URL: `my-order` → **Create**
3. Drag the `myOrdersTKR` component onto the page body
4. Click **Save**

---

### Step 11 — Give Guest Users Access

Customers use the site without logging in (guest users). You need to
give them permission to use the Apex code and read/write orders.

1. Go to **Setup** → **Digital Experiences** → **All Sites**
2. Click **Workspaces** next to your site → **Administration**
3. Click **Pages** → **Go to Force.com** → **Public Access Settings**
4. Click **Edit** on the Guest User Profile
5. Under **Apex Class Access** → Add `OrderController`
6. Under **Object Settings**:
   - `Menu_Item__c` → Read
   - `Order__c` → Read, Create
   - `Order_Item__c` → Read, Create
7. Click **Save**

**Also give field-level access:**

Still on the Guest User Profile:
1. Under **Field-Level Security** → `Menu_Item__c` → click **Edit**
2. Tick **Read** on: Name, Category__c, Price__c, Available__c, Description__c
3. **Save**

---

### Step 12 — Set Menu Item Sharing (so guests can see the menu)

1. Go to **Setup** → **Sharing Settings**
2. Find **Menu_Item__c** in the object list
3. Set **Default External Access** to **Public Read Only**
4. Click **Save**

---

### Step 13 — Publish the Site

Back in Experience Builder, click **Publish** (top right corner) and confirm.

Your customer website is now live. Copy the site URL — this is the link you
share with customers.

---

## You Are Done

| Page | Who uses it | How to access |
|---|---|---|
| Customer menu | Customers | Your Experience Cloud site URL + `/menu` |
| Order tracking | Customers | Your Experience Cloud site URL + `/my-order` |
| Kitchen queue | Kitchen staff | TKR app → Kitchen page |
| Admin dashboard | Admin | TKR app → Admin Dashboard page |

---

## Making Changes

After cloning the project and making code edits locally, deploy your changes:

```bash
sf project deploy start
```

Then go to Experience Builder and click **Publish** to push LWC changes to
the live site.

---

## Project Structure

```
force-app/main/default/
├── classes/          Apex backend (OrderController.cls)
├── lwc/              Lightning Web Components (frontend UI)
│   ├── menuTKR/          Customer menu page
│   ├── cartTKR/          Shopping cart
│   ├── myOrdersTKR/      Order tracking page
│   ├── kitchenOrdersTKR/ Kitchen order queue
│   ├── adminDashboardTKR/Admin dashboard container
│   ├── adminStatsTKR/    KPI stats panel
│   ├── adminOrdersTKR/   All orders table
│   └── adminMenuTKR/     Menu management panel
├── objects/          Custom object and field definitions
└── triggers/         Apex triggers
```
