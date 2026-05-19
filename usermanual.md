# SettleBill User Manual

## 1. What SettleBill does
SettleBill helps groups track shared expenses, split bills fairly, and settle who owes whom.

Core capabilities:
- Create networks (friends, family, team, trip groups)
- Add bills (standard or itemized)
- Assign payer and participants
- Track paid/unpaid split status
- View settlement suggestions (minimum transactions)
- Export/share final calculations

---

## 2. Prerequisites
Before using SettleBill:
1. Sign in to your account.
2. Ensure **SettleBill** is enabled in your app settings.
3. Create at least one network and add members.

---

## 3. Navigation overview
Main SettleBill areas:
- **Overview**: quick totals and recent activity
- **Networks**: create/manage groups
- **Members**: manage people and wallet images
- **Bills**: create/edit/track bills and settlements
- **Bill Split (Itemized)**: split by line items and quantities
- **Simplify**: compute minimal settlement transactions
- **Settings**: import/export and display preferences

---

## 4. Create a network
1. Go to **SettleBill → Networks**.
2. Click **Create Network**.
3. Enter network name/details.
4. Add members (name/email as applicable).
5. Save.

Tips:
- Use one network per context (e.g., “Goa Trip”, “Flat Expenses”).
- Keep member names consistent to avoid confusion in reports.

---

## 5. Add a bill (standard)
1. Go to **SettleBill → Bills**.
2. Click **Create Bill**.
3. Select the **Network**.
4. Enter bill details:
   - Title
   - Total amount
   - Currency
   - Paid by (payer)
   - Optional discount
5. Choose who should share the bill.
6. Save.

After saving:
- Splits are generated.
- Bill appears as **Active/Pending** until all applicable splits are settled.

---

## 6. Add an itemized bill
Use this when each person consumed different items.

1. Open **SettleBill → Bill Split (Itemized)**.
2. Select network, bill title, and payer.
3. Add items (name, amount, quantity).
4. Assign members per item.
5. (Optional) Upload bill image and extract items.
6. Review totals and distribution.
7. Save the itemized bill.

Best practices:
- Verify extracted OCR items before final save.
- Confirm quantity and assigned members for each line item.

---

## 7. Manage bill details
From a bill detail page, you can:
- View total, discount, and per-member split share
- See current bill status (**Settled** or **Active**)
- Add/update bill notes/comments (if enabled)
- Edit or delete bill (based on permissions)

Auto-settlement behavior:
- If all splits are marked paid, bill status updates to **Settled**.

---

## 8. Mark splits as paid/unpaid
Inside bill/network views:
- Mark individual member split as **Paid** when money is received.
- Revert to **Unpaid** if needed.
- Use bulk actions (where available) to settle/unsettle multiple splits for a debtor/creditor pair.

Recommendation:
- Update payment status immediately after transfer to keep calculations accurate.

---

## 9. Simplify settlements
1. Go to **SettleBill → Simplify**.
2. Select a network (if prompted).
3. Review who owes whom and how much.
4. Use suggested minimal transactions to settle faster.

Outcome:
- Reduces total number of payments needed in the group.

---

## 10. Final calculation and public sharing
SettleBill supports final calculation summaries and shareable/public views.

Typical flow:
1. Generate final calculation from network data.
2. Review settlement rows.
3. Share the generated public link with participants.

Use case:
- End-of-trip reconciliation where everyone needs one final summary.

---

## 11. Wallet images
In **Members**:
- Upload member wallet/payment images (QR/wallet screenshots).
- Reuse these images during settlement for quicker payments.

Tips:
- Name images clearly (e.g., `Alex_GPay_QR`).
- Replace outdated payment handles promptly.

---

## 12. Import/export and settings
In **SettleBill → Settings** you can:
- Set preferred currency and display preferences
- Export bills/networks (CSV)
- Import supported CSV data
- Filter export by date range

Note:
- Keep exported files as backups before bulk imports/updates.

---

## 13. Common troubleshooting
### Bill not visible in list
- Confirm correct network/filter is selected.
- Check whether the bill was deleted.

### Wrong split amounts
- Verify discount settings and excluded members.
- Recheck item assignments in itemized bills.

### Cannot mark settlement correctly
- Ensure you are editing the correct network/bill.
- Refresh and retry if stale cached data is shown.

### Public share not loading
- Verify link correctness.
- Ensure the shared final calculation record still exists.

---

## 14. Recommended workflow for teams
1. Create one network per project/trip.
2. Add all members first.
3. Record bills same day.
4. Use itemized mode for mixed consumption.
5. Mark payments as soon as transfers happen.
6. Run **Simplify** weekly or at trip end.
7. Share final calculation link for closure.

---

## 15. Quick glossary
- **Network**: group of members sharing expenses
- **Bill**: an expense record
- **Split**: an individual member’s share of a bill
- **Payer**: member who initially paid the bill
- **Settled**: split (or full bill) is fully paid/reconciled
- **Simplify**: optimized list of minimum transactions to clear dues
