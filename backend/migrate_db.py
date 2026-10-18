import sqlite3

conn = sqlite3.connect('waste2raw.db')
cursor = conn.cursor()

# 1. Update organizations table
org_cols = [c[1] for c in cursor.execute('PRAGMA table_info(organizations)').fetchall()]
if 'passport_id' not in org_cols:
    cursor.execute("ALTER TABLE organizations ADD COLUMN passport_id VARCHAR")
    print("Added passport_id to organizations")

# 2. Update orders table
order_cols = [c[1] for c in cursor.execute('PRAGMA table_info(orders)').fetchall()]
if 'admin_verified' not in order_cols:
    cursor.execute("ALTER TABLE orders ADD COLUMN admin_verified BOOLEAN DEFAULT 0")
    print("Added admin_verified to orders")

if 'admin_verified_at' not in order_cols:
    cursor.execute("ALTER TABLE orders ADD COLUMN admin_verified_at DATETIME")
    print("Added admin_verified_at to orders")

if 'admin_verified_by' not in order_cols:
    cursor.execute("ALTER TABLE orders ADD COLUMN admin_verified_by VARCHAR")
    print("Added admin_verified_by to orders")

if 'admin_verification_notes' not in order_cols:
    cursor.execute("ALTER TABLE orders ADD COLUMN admin_verification_notes TEXT")
    print("Added admin_verification_notes to orders")

conn.commit()
print("Migration complete!")
conn.close()
