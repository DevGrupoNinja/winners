import sqlite3
import os

# Database path
db_path = r"c:\Users\guisa\Desktop\projetos\winners\backend\winners.db"

def seed_ranges():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear existing ranges to avoid duplicates during development
    cursor.execute("DELETE FROM configfunctionaldirectionrange")

    ranges = [
        # re_min, re_max, er_min, er_max, direction
        (2.0, 3.0, 0.0, 1.2, "VO2"),
        (1.0, 2.0, 0.0, 1.2, "Aeróbico"),
        (0.0, 1.0, 1.2, 3.0, "Anaeróbico")
    ]

    cursor.executemany(
        "INSERT INTO configfunctionaldirectionrange (re_min, re_max, er_min, er_max, direction) VALUES (?, ?, ?, ?, ?)",
        ranges
    )

    conn.commit()
    conn.close()
    print("Functional direction ranges seeded successfully!")

if __name__ == "__main__":
    seed_ranges()
