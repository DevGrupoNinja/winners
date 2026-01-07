"""
Script para explorar o banco de dados e entender a estrutura de bases funcionais.
"""
import sqlite3

def explore_db():
    conn = sqlite3.connect('winners.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("EXPLORAÇÃO DO BANCO DE DADOS - WINNERS")
    print("=" * 60)
    
    # Listar todas as tabelas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    print("\n📋 TABELAS NO BANCO:")
    for t in tables:
        print(f"   - {t[0]}")
    
    # Verificar tabela de faixas de direção funcional
    print("\n" + "=" * 60)
    print("📊 FAIXAS DE DIREÇÃO FUNCIONAL (ConfigFunctionalDirectionRange):")
    print("=" * 60)
    try:
        cursor.execute("SELECT * FROM configfunctionaldirectionrange")
        rows = cursor.fetchall()
        if rows:
            cursor.execute("PRAGMA table_info(configfunctionaldirectionrange)")
            columns = [col[1] for col in cursor.fetchall()]
            print(f"   Colunas: {columns}")
            print(f"   Total de registros: {len(rows)}")
            for row in rows:
                print(f"   {dict(zip(columns, row))}")
        else:
            print("   ⚠️ Tabela vazia!")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # Verificar subdivisões com functional_base
    print("\n" + "=" * 60)
    print("📊 SUBDIVISÕES DE TREINO COM BASE FUNCIONAL:")
    print("=" * 60)
    try:
        cursor.execute("""
            SELECT DISTINCT functional_base, COUNT(*) as count 
            FROM trainingsubdivision 
            WHERE functional_base IS NOT NULL AND functional_base != ''
            GROUP BY functional_base
        """)
        rows = cursor.fetchall()
        if rows:
            print("   Bases funcionais encontradas:")
            for row in rows:
                print(f"   - '{row[0]}': {row[1]} ocorrências")
        else:
            print("   ⚠️ Nenhuma subdivisão com base funcional definida!")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # Verificar séries com rpe_description
    print("\n" + "=" * 60)
    print("📊 SÉRIES DE TREINO COM RPE_DESCRIPTION:")
    print("=" * 60)
    try:
        cursor.execute("""
            SELECT DISTINCT rpe_description, COUNT(*) as count 
            FROM trainingseries 
            WHERE rpe_description IS NOT NULL AND rpe_description != ''
            GROUP BY rpe_description
        """)
        rows = cursor.fetchall()
        if rows:
            print("   RPE Descriptions encontradas:")
            for row in rows:
                print(f"   - '{row[0]}': {row[1]} ocorrências")
        else:
            print("   ⚠️ Nenhuma série com rpe_description definida!")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # Ver estrutura das tabelas relevantes
    print("\n" + "=" * 60)
    print("📊 ESTRUTURA DA TABELA trainingsubdivision:")
    print("=" * 60)
    try:
        cursor.execute("PRAGMA table_info(trainingsubdivision)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"   {col[1]} ({col[2]})")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print("\n" + "=" * 60)
    print("📊 ESTRUTURA DA TABELA trainingseries:")
    print("=" * 60)
    try:
        cursor.execute("PRAGMA table_info(trainingseries)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"   {col[1]} ({col[2]})")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    conn.close()

if __name__ == "__main__":
    explore_db()
