-- ============================================================
-- GEAUX OPS — Seed Data Migration 003
-- Job Templates: Business + Household Chores
-- Run AFTER 002_rls.sql
-- ============================================================

-- ============================================================
-- BUSINESS TEMPLATES
-- ============================================================

-- RON — Online Notarization
insert into public.job_templates (name, color, category, default_steps) values (
  'RON — Online Notarization',
  '#C8A44E',
  'business',
  '[
    {"text": "Find documents in email", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Download all documents", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Upload to PandaDoc", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Customize document (fields, signers)", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Contact signers with session details", "sort_order": 4, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Confirm time with all signers", "sort_order": 5, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Add to Google Calendar", "sort_order": 6, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Conduct RON session", "sort_order": 7, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Invoice via QuickBooks", "sort_order": 8, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Confirm payment received", "sort_order": 9, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

-- Cogency Global — Process Service
insert into public.job_templates (name, color, category, default_steps) values (
  'Cogency Global — Process Service',
  '#60A5FA',
  'business',
  '[
    {"text": "Receive documents from Cogency", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Date-stamp documents", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Review documents for completeness", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Scan all documents", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Upload to Cogency portal", "sort_order": 4, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Notify client of delivery", "sort_order": 5, "is_high_impact": false, "allowance_amount": 0},
    {"text": "File original documents", "sort_order": 6, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

-- Own RA — Registered Agent Service / Mail
insert into public.job_templates (name, color, category, default_steps) values (
  'Own RA — Service / Mail',
  '#A78BFA',
  'business',
  '[
    {"text": "Receive documents or mail", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Date-stamp documents", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Identify client from records", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Scan all documents", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Notify client via email or phone", "sort_order": 4, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Forward originals to client", "sort_order": 5, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Log entry in RA records", "sort_order": 6, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

-- Southern VUEs — Real Estate Photo Shoot
insert into public.job_templates (name, color, category, default_steps) values (
  'Southern VUEs — RE Photo Shoot',
  '#FB923C',
  'business',
  '[
    {"text": "Confirm shoot date/time with client", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Add to Google Calendar", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Charge all equipment (batteries, drone)", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Travel to location", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Walk through shot checklist", "sort_order": 4, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Capture drone aerials", "sort_order": 5, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Capture interior and exterior shots", "sort_order": 6, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Transfer files to computer", "sort_order": 7, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Edit photos", "sort_order": 8, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Prepare MLS-ready package", "sort_order": 9, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Deliver to client and invoice", "sort_order": 10, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

-- Podcast — Film & Edit
insert into public.job_templates (name, color, category, default_steps) values (
  'Podcast — Film & Edit',
  '#FB923C',
  'business',
  '[
    {"text": "Confirm topic and guest (if applicable)", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Set up recording equipment", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Film episode", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Transfer footage to computer", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Edit video", "sort_order": 4, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Edit and master audio", "sort_order": 5, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Create thumbnail", "sort_order": 6, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Publish episode", "sort_order": 7, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Promote on social media", "sort_order": 8, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

-- Custom Task (blank template)
insert into public.job_templates (name, color, category, default_steps) values (
  'Custom Task',
  '#8B8F9E',
  'custom',
  '[]'
);

-- ============================================================
-- HOUSEHOLD CHORE TEMPLATES — DAILY
-- ============================================================

insert into public.job_templates (name, color, category, default_steps) values (
  'Make Beds',
  '#4ADE80',
  'household',
  '[
    {"text": "Straighten fitted sheet", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Straighten top sheet and blanket", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Fluff and arrange pillows", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Smooth bedspread/comforter", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Put Dirty Clothes in Hamper',
  '#4ADE80',
  'household',
  '[
    {"text": "Collect clothes from bedroom floor", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Collect clothes from bathroom floor", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Put all items in hamper", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Clear and Wipe Dining Table',
  '#4ADE80',
  'household',
  '[
    {"text": "Clear all dishes to the sink", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe table surface", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe chairs if needed", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Push chairs back in", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Load or Unload Dishwasher',
  '#4ADE80',
  'household',
  '[
    {"text": "Check if dishes are clean or dirty", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Put away all clean dishes", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Load all dirty dishes from sink", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Add detergent and start if full", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Take Out Trash',
  '#4ADE80',
  'household',
  '[
    {"text": "Collect trash bags from all rooms", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Take bags to outside bin", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Replace trash bags in all cans", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Pick Up Toys and Personal Items',
  '#4ADE80',
  'household',
  '[
    {"text": "Collect items from living room", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Collect items from hallways and common areas", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Return all items to their proper place", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Wipe Kitchen Counters',
  '#4ADE80',
  'household',
  '[
    {"text": "Clear items off all counter surfaces", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Spray and wipe all counter surfaces", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe around sink and faucet", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Return items to counters", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Sweep Kitchen Floor',
  '#4ADE80',
  'household',
  '[
    {"text": "Move chairs and loose obstacles", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Sweep entire floor including corners", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Collect debris into dustpan and dispose", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Return chairs and items", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Deal With Mail',
  '#4ADE80',
  'household',
  '[
    {"text": "Collect all mail from mailbox", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Sort: recycle junk mail immediately", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Open and review important items", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "File important documents", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0}
  ]'
);

-- ============================================================
-- HOUSEHOLD CHORE TEMPLATES — WEEKLY
-- ============================================================

insert into public.job_templates (name, color, category, default_steps) values (
  'Laundry — Wash, Fold, and Put Away',
  '#4ADE80',
  'household',
  '[
    {"text": "Sort laundry by color/type", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Run wash cycles", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Move to dryer or hang to dry", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Fold all clean laundry", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Put away all items in correct drawers/closets", "sort_order": 4, "is_high_impact": true, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Vacuum All Floors',
  '#4ADE80',
  'household',
  '[
    {"text": "Clear floor of obstacles and items", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Vacuum all bedrooms", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Vacuum living areas and hallways", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Vacuum stairs if applicable", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Empty vacuum if needed", "sort_order": 4, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Mop Hard Floors',
  '#4ADE80',
  'household',
  '[
    {"text": "Sweep or vacuum floors first", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Prepare mop bucket with cleaner", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Mop all hard floor surfaces", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Allow floors to dry completely", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Clean Bathrooms',
  '#4ADE80',
  'household',
  '[
    {"text": "Scrub and disinfect toilet (bowl, seat, base)", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Scrub shower/tub", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Clean and wipe sink and faucet", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe and shine mirror", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Sweep and mop bathroom floor", "sort_order": 4, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Restock toilet paper and hand soap", "sort_order": 5, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Dust Surfaces',
  '#4ADE80',
  'household',
  '[
    {"text": "Dust furniture surfaces in all rooms", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Dust shelves and decorations", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe baseboards", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Wipe down light switches and door handles", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Clean Out Refrigerator',
  '#4ADE80',
  'household',
  '[
    {"text": "Remove all items from fridge", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Throw out expired or spoiled food", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe down all shelves and drawers", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Return items in organized manner", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Grocery Shopping',
  '#4ADE80',
  'household',
  '[
    {"text": "Check pantry and fridge for what is needed", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Write or confirm shopping list", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Shop for all items on the list", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Put groceries away when home", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Change Bed Sheets',
  '#4ADE80',
  'household',
  '[
    {"text": "Strip all sheets and pillowcases", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Put old sheets in laundry", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Put on fitted sheet", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Put on top sheet and pillowcases", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Smooth and make bed", "sort_order": 4, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Wipe Down Kitchen Appliances',
  '#4ADE80',
  'household',
  '[
    {"text": "Wipe microwave inside and out", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe stovetop and knobs", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe refrigerator exterior", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Wipe other small appliances (toaster, coffee maker)", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Take Out Recycling',
  '#4ADE80',
  'household',
  '[
    {"text": "Collect recycling from all rooms", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Sort recycling by type if required", "sort_order": 1, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Take recycling to outdoor bin", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Replace recycling bin liners", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

-- ============================================================
-- HOUSEHOLD CHORE TEMPLATES — MONTHLY
-- ============================================================

insert into public.job_templates (name, color, category, default_steps) values (
  'Deep Clean Kitchen',
  '#4ADE80',
  'household',
  '[
    {"text": "Clean inside oven (racks and interior)", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Clean behind and under appliances", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Degrease stovetop and hood vent", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe inside all cabinets", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Clean and organize pantry", "sort_order": 4, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Clean Windows',
  '#4ADE80',
  'household',
  '[
    {"text": "Wipe window frames and sills", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Clean interior glass on all windows", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Clean exterior glass where accessible", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe down blinds or curtains", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Organize Closets and Drawers',
  '#4ADE80',
  'household',
  '[
    {"text": "Remove all items from closet/drawer", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Discard or donate items no longer needed", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe down interior surfaces", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Return and organize remaining items neatly", "sort_order": 3, "is_high_impact": true, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Dust Ceiling Fans and Light Fixtures',
  '#4ADE80',
  'household',
  '[
    {"text": "Dust ceiling fan blades", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Wipe light fixtures and covers", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Dust tops of door frames and high shelves", "sort_order": 2, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Clean Garage or Storage Areas',
  '#4ADE80',
  'household',
  '[
    {"text": "Sweep garage/storage floor", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Discard trash and recycling", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Reorganize shelves and bins", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Return tools and equipment to proper place", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Wash Outdoor Trash Cans',
  '#4ADE80',
  'household',
  '[
    {"text": "Empty and remove any loose debris", "sort_order": 0, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Rinse interior with hose", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Scrub with soap and brush", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Rinse and allow to air dry", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0}
  ]'
);

insert into public.job_templates (name, color, category, default_steps) values (
  'Deep Clean Pet Areas',
  '#4ADE80',
  'household',
  '[
    {"text": "Wash pet bedding and blankets", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Scrub food and water bowls", "sort_order": 1, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Clean litter box or crate thoroughly", "sort_order": 2, "is_high_impact": true, "allowance_amount": 0},
    {"text": "Vacuum or sweep pet hair from surrounding area", "sort_order": 3, "is_high_impact": false, "allowance_amount": 0},
    {"text": "Wipe down any pet furniture or toys", "sort_order": 4, "is_high_impact": false, "allowance_amount": 0}
  ]'
);
