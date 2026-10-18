import sqlite3
import shutil
import os

db_path = "waste2raw.db"
backup_path = "waste2raw.db.bak"

if not os.path.exists(backup_path):
    shutil.copyfile(db_path, backup_path)
    print(f"Created backup at {backup_path}")
else:
    print(f"Backup already exists at {backup_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Find admin user
cursor.execute("SELECT id, email, role, full_name FROM users WHERE role = 'SUPER_ADMIN'")
admin = cursor.fetchone()
if not admin:
    raise RuntimeError("No SUPER_ADMIN user found!")

admin_id, admin_email, admin_role, admin_name = admin
print(f"Preserving SUPER_ADMIN: {admin_name} ({admin_email}), ID: {admin_id}")

# 1. Clear dependent operational and transactional tables
tables_to_clear = [
    "reviews",
    "orders",
    "waste_evidence",
    "waste_batches",
    "buyer_requirements",
    "reports",
    "notifications",
    "audit_logs",
    "organizations"
]

for table in tables_to_clear:
    cursor.execute(f"DELETE FROM {table}")
    print(f"Cleared table: {table}")

# 2. Delete all non-admin users
cursor.execute("DELETE FROM users WHERE role != 'SUPER_ADMIN' AND id != ?", (admin_id,))
print("Deleted all non-admin users.")

conn.commit()

# Vacuum database to shrink and optimize
cursor.execute("VACUUM")
conn.commit()

print("\n--- Verification of Database State ---")
for t in ["users", "organizations", "waste_batches", "buyer_requirements", "orders", "notifications", "audit_logs"]:
    cnt = cursor.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"Table '{t}': {cnt} rows")

print("\nRemaining user(s):")
for u in cursor.execute("SELECT id, email, role, full_name, account_status FROM users").fetchall():
    print(" ", u)

conn.close()
print("\n[SUCCESS] DBMS cleaned completely. Fresh new platform ready under ReSourceX!")
