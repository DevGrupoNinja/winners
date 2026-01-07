"""
Script para adicionar a coluna series_id ao sessionfeedback
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('winners.db')
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute('PRAGMA table_info(sessionfeedback)')
    cols = [c[1] for c in cursor.fetchall()]
    print(f'Colunas atuais: {cols}')
    
    if 'series_id' not in cols:
        print('Adicionando coluna series_id...')
        cursor.execute('ALTER TABLE sessionfeedback ADD COLUMN series_id INTEGER REFERENCES trainingseries(id)')
        conn.commit()
        print('Coluna series_id adicionada com sucesso!')
    else:
        print('Coluna series_id já existe!')
    
    conn.close()

if __name__ == "__main__":
    migrate()
