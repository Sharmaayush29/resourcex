import sqlite3

conn = sqlite3.connect('waste2raw.db')
cursor = conn.cursor()

tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables in waste2raw.db:", tables)

for t in tables:
    try:
        count = cursor.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"  {t}: {count} rows")
    except Exception as e:
        print(f"  {t}: error {e}")

print("\nUsers detail:")
for row in cursor.execute("SELECT id, email, role, full_name, account_status FROM users").fetchall():
    print(" ", row)

conn.close()
